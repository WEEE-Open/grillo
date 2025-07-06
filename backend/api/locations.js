import * as v from "valibot";
import dayjs from "../day.js";

import { db } from "../index.js";

export const locations = {
	auth: "RO",
	route: "/locations",
	async handler(req, res) {
		const locations = await db.getLocations();
		res.json(locations);
	},
};

export const locationsId = {
	auth: "RO",
	route: "/locations/:id",
	async handler(req, res) {
		if (req.params.id == "default") {
			req.params.id = await db.getConfig("defaultLocation");
			if (req.params.id == null) {
				return res.status(404).json({ error: "Location not found" });
			}
		}
		let location = await db.getLocation(req.params.id);
		if (!location) {
			return res.status(404).json({ error: "Location not found" });
		}

		let people = await db.getUsersInLocation(location.id);

		let date = dayjs();
		startWeek = date.startOf("isoWeek").unix();
		endWeek = date.endOf("isoWeek").unix();
		const bookings = await db.getBookings(startWeek, endWeek, null, req.params.id);

		res.json({
			...location,
			people,
			bookings,
		});
	},
};

export const locationsNew = {
	auth: "admin",
	method: "POST",
	route: "/locations",
	body: () =>
		v.object({
			id: v.pipe(
				v.string(),
				v.trim(),
				v.nonEmpty(),
				v.notValue("default"),
				v.regex(/^[a-zA-Z0-9-]+$/),
			),
			name: v.pipe(v.string(), v.trim(), v.nonEmpty()),
		}),
	async handler(req, res) {
		const existingLocation = await db.getLocation(req.body.id);
		if (existingLocation) {
			return res.status(400).json({ error: "Location already exists" });
		}

		let location = await db.addLocation(req.body.id, req.body.name);
		res.json(location);
	},
};

export const locationsIdEdit = {
	auth: "admin",
	method: "POST",
	route: "/locations/:id",
	body: () =>
		v.object({
			name: v.pipe(v.string(), v.trim(), v.nonEmpty()),
		}),
	async handler(req, res) {
		let location = await db.getLocation(req.params.id);
		if (!location) {
			return res.status(404).json({ error: "Location not found" });
		}

		let editedLocation = await db.editLocation(req.params.id, req.body.name);
		res.json(editedLocation);
	},
};

export const locationIdDelete = {
	auth: "admin",
	method: "DELETE",
	route: "/locations/:id",
	async handler(req, res) {
		let location = await db.getLocation(req.params.id);
		if (!location) {
			return res.status(404).json({ error: "Location not found" });
		}

		await db.deleteLocation(req.params.id);
		res.sendStatus(204);
	},
};

export const locationIdRing = {
	auth: "RW",
	method: "POST",
	route: "/locations/:id/ring",
	body: () => v.any(),
	async handler(req, res) {
		if (req.params.id == "default") {
			req.params.id = await db.getConfig("defaultLocation");
		}
		try {
			await io.to(req.params.id).timeout(10000).emitWithAck("ring", { user: req.session.user.id });
			res.sendStatus(204);
		} catch (error) {
			res.status(503).send({ error: "No response from WEEETofono" });
			return;
		}
	},
};
