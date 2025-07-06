import * as v from "valibot";

import { db } from "../index.js";

export const events = {
	auth: "RO",
	route: "/events",
	async handler(req, res) {
		res.json(await db.getEvents());
	},
};

export const eventsId = {
	auth: "RO",
	route: "/events/:id",
	async handler(req, res) {
		let event = await db.getEvent(req.params.id);
		if (!event) {
			return res.status(404).json({ error: "Event not found" });
		}
		res.json(event);
	},
};

export const eventsNew = {
	auth: "admin",
	method: "POST",
	route: "/events",
	body: () =>
		v.pipe(
			v.object({
				title: v.pipe(v.string(), v.trim()),
				description: v.nullish(v.pipe(v.string(), v.trim())),
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
			v.check(input => {
				if (input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		let event = await db.addEvent(
			req.body.startTime,
			req.body.endTime,
			req.body.title,
			req.body.description,
		);
		res.json(event);
	},
};

export const eventsIdEdit = {
	auth: "admin",
	method: "POST",
	route: "/events/:id",
	body: () =>
		v.pipe(
			v.object({
				title: v.pipe(v.string(), v.trim()),
				description: v.nullish(v.pipe(v.string(), v.trim())),
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
			v.check(input => {
				if (input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		let event = await db.getEvent(req.params.id);
		if (!event) {
			return res.status(404).json({ error: "Event not found" });
		}
		let editedEvent = await db.editEvent(
			event.id,
			req.body.startTime,
			req.body.endTime,
			req.body.title,
			req.body.description,
		);
		res.json(editedEvent);
	},
};

export const eventsIdDelete = {
	auth: "admin",
	method: "DELETE",
	route: "/events/:id",
	async handler(req, res) {
		const event = await db.getEvent(req.params.id);
		if (!event) {
			return res.status(404).json({ error: "Event not found" });
		}
		await db.deleteEvent(event.id);
		res.sendStatus("204");
	},
};
