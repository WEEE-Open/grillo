import * as v from "valibot";

import { db } from "../index.js";

export const audits = {
	auth: "RO",
	route: "/audits",
	async handler(req, res) {
		let userId = req.body.user ?? null;
		let dateInput = req.body.dateString;
		let baseDate = dayjs(dateInput);
		if (!baseDate.isValid()) {
			baseDate = dayjs(); // current week is not valid
		}
		const startWeek = baseDate.startOf("isoWeek").unix(); // in seconds
		const endWeek = baseDate.endOf("isoWeek").unix();

		let weekAudit = await db.getAudits(startWeek, endWeek, userId);
		res.json(weekAudit);
	},
};

export const auditsId = {
	auth: "RO",
	route: "/audits/:id",
	async handler(req, res) {
		let audit = await db.getAudit(req.params.id);
		if (!audit) {
			return res.status(404).json("Audit not found");
		}
		res.json(audit);
	},
};

export const auditsNew = {
	auth: "RW",
	method: "POST",
	route: "/audits",
	body: ({ req }) =>
		v.variant("login", [
			v.object({
				login: v.literal(true),
				user: v.fallback(v.pipe(v.string(), v.trim(), v.nonEmpty()), req.session.user.id),
				location: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
				approved: v.nullish(v.boolean()),
				startTime: v.nullish(
					v.pipe(
						v.union([
							v.pipe(
								v.string(),
								v.transform(Number.parseInt),
								v.check(v => !Number.isNaN(v)),
							),
							v.number(),
						]),
						v.transform(Math.round),
					),
				),
				previousSummary: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
			}),
			v.pipe(
				v.object({
					login: v.nullish(v.literal(false)),
					user: v.fallback(v.pipe(v.string(), v.trim(), v.nonEmpty()), req.session.user.id),
					location: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
					approved: v.nullish(v.boolean()),
					summary: v.pipe(v.string(), v.trim(), v.nonEmpty()),
					startTime: v.pipe(
						v.union([
							v.pipe(
								v.string(),
								v.transform(Number.parseInt),
								v.check(v => !Number.isNaN(v)),
							),
							v.number(),
						]),
						v.transform(Math.round),
					),
					endTime: v.pipe(
						v.union([
							v.pipe(
								v.string(),
								v.transform(Number.parseInt),
								v.check(v => !Number.isNaN(v)),
							),
							v.number(),
						]),
						v.transform(Math.round),
					),
				}),
				v.check(input => {
					if (input.startTime && input.endTime) {
						return input.startTime < input.endTime;
					}
					return true;
				}, "The end time must be greater than the start time."),
			),
		]),
	async handler(req, res) {
		if (!req.session.isAdmin) {
			req.body.approved = false;
			if (req.body.user != req.session.user.id) {
				return res.status(403).json({ error: "Can't add audit for another user" });
			}
		}

		if (!req.body.location) req.body.location = await db.getConfig("defaultLocation");

		let location = db.getLocation(req.body.location);

		if (!location) {
			return res.status(404).json({ error: "Location not found" });
		}

		if (req.body.login) {
			const activeAudit = await db.getActiveAudit(req.body.userId);

			let oldAudit;
			if (activeAudit) {
				if (!req.body.previousSummary) {
					return res.status(400).json({ error: "Must provide summary when switching location" });
				}
				if (!req.body.endTime) req.body.endTime = Math.floor(Date.now() / 1000);
				if (activeAudit.startTime < req.body.endTime) {
					return res
						.status(400)
						.json({ error: "The end time must be greater than the start time" });
				}
				oldAudit = db.editAudit(
					activeAudit.id,
					activeAudit.startTime,
					req.body.endTime,
					req.body.previousSummary,
					req.body.approved,
					req.body.location,
				);
			}

			let newAudit = await db.addAudit(
				req.body.user,
				req.body.startTime,
				null,
				location.id,
				null,
				null,
			);

			return res.json({ ...newAudit, previous: oldAudit });
		}

		if (!req.body.endTime) req.body.endTime = Math.floor(Date.now() / 1000);

		let audit = await db.addAudit(
			req.body.user,
			req.body.startTime,
			req.body.endTime,
			location.id,
			req.body.summary,
			req.body.approved,
		);
		res.json(audit);
	},
};

export const auditsPatch = {
	auth: "RW",
	method: "PATCH",
	route: "/audits",
	body: () =>
		v.object({
			logout: v.literal(true),
			user: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
			approved: v.nullish(v.boolean()),
			summary: v.pipe(v.string(), v.trim(), v.nonEmpty()),
			endTime: v.nullish(
				v.pipe(
					v.union([
						v.pipe(
							v.string(),
							v.transform(Number.parseInt),
							v.check(v => !Number.isNaN(v)),
						),
						v.number(),
					]),
					v.transform(Math.round),
				),
			),
		}),
	async handler(req, res) {
		if (!req.session.isAdmin) {
			req.body.approved = false;
			if (req.body.user && req.body.user != req.session.user.id) {
				return res.status(403).json({ error: "Can't add audit for another user" });
			}
		}

		if (!req.body.endTime) req.body.endTime = Math.floor(Date.now() / 1000);

		const activeAudit = await db.getActiveAudit(req.body.userId);

		if (activeAudit.startTime < req.body.endTime) {
			return res.status(400).json({ error: "The end time must be greater than the start time" });
		}

		let editedAudit = db.editAudit(
			activeAudit.id,
			activeAudit.startTime,
			req.body.endTime,
			req.body.summary,
			req.body.approved,
			activeAudit.location,
		);

		res.json(editAudit);
	},
};

export const auditsIdPatch = {
	auth: "RW",
	method: "PATCH",
	route: "/audits/:id",
	body: ({ req }) =>
		v.pipeAsync(
			v.object({
				location: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
				approved: v.nullish(v.boolean()),
				summary: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
				startTime: v.nullish(
					v.pipe(
						v.union([
							v.pipe(
								v.string(),
								v.transform(Number.parseInt),
								v.check(v => !Number.isNaN(v)),
							),
							v.number(),
						]),
						v.transform(Math.round),
					),
				),
				endTime: v.nullish(
					v.pipe(
						v.union([
							v.pipe(
								v.string(),
								v.transform(Number.parseInt),
								v.check(v => !Number.isNaN(v)),
							),
							v.number(),
						]),
						v.transform(Math.round),
					),
				),
			}),
			v.transformAsync(async input => {
				input.oldAudit = await db.getAudit(req.params.id);
				return input;
			}),
			v.check(input => !!input.oldAudit, "Invalid id"), // Not entirely satisfied with this because it returns 400 instead of 404, but it'll do for now
			v.transform(input => {
				if (input.location) input.location = input.oldAudit.location;
				if (input.approved) input.approved = input.oldAudit.approved;
				if (input.summary) input.summary = input.oldAudit.summary;
				if (input.startTime) input.startTime = input.oldAudit.startTime;
				if (input.endTime) input.endTime = input.oldAudit.endTime;
				return input;
			}),
			v.transform(input => {
				if (!req.session.isAdmin) {
					input.approved = false;
				}
			}),
			v.check(input => {
				if (input.startTime && input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		if (!req.session.isAdmin && input.oldAudit.user != req.session.user.id) {
			return res.status(403).json({ error: "Can't add audit for another user" });
		}

		const editedAudit = db.editAudit(
			req.params.id,
			req.body.startTime,
			req.body.endTime,
			req.body.summary,
			req.body.approved,
			req.body.location,
		);
		res.json(editAudit);
	},
};

export const auditsIdDelete = {
	auth: "RW",
	method: "DELETE",
	route: "/audits/:id",
	async handler(req, res) {
		let audit = await db.getAudit(req.params.id);

		if (!audit) {
			res.status(404).json({ error: "Audit not found" });
			return;
		}

		if ((audit.userId != req.session.user.id || audit.approved) && !req.session.isAdmin) {
			res.status(403).send("Not authorized");
			return;
		}

		await db.deleteAudit(req.params.id);
		res.status(204).send();
	},
};
