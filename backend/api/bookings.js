import * as v from "valibot";
import dayjs from "../day.js";

import { db } from "../index.js";
import { user, userList } from "./user.js";

export const bookings = {
	auth: "RO",
	route: "/bookings/",
	async handler(req, res) {
		if (!req.session && !req.session.api) {
			return res.status(401).json({ error: "Not authenticated" });
		}
		let dateParam = req.query.date || null;
		let unixDate = undefined;

		if (!dateParam) unixDate = dayjs().unix();
		else unixDate = parseInt(dateParam, 10);

		if (String(unixDate).length === 10) unixDate *= 1000;
		let date = dayjs(unixDate);
		const startWeek = date.startOf("isoWeek").unix();
		const endWeek = date.endOf("isoWeek").unix();

		let users = [];
		let validFilter = false;

		if (req.query.users) {
			let usersList = req.query.users.split(",");
			for (let userId of usersList) {
				let user = await db.getUser(userId);
				if (user) {
					users.push(user.id);
					validFilter = true;
				} else {
					return res.status(400).json({ error: "User in users list not valid" });
				}
			}
		}

		// TODO: requires implementing groups fetching in db class
		/*if (req.query.groups) {
			let groupsList = req.query.users.split(',');
			for (let groupId of groupsList) {
				let group = await db.getGroup(groupId);
				if (group) {
					db.getUsersByGroup(groupId);
					validFilter = true;
				} else {
					return res.status(400).json({ error: "Group in groups list not valid" });
				}
			}
		}*/

		const bookings = await db.getBookings(startWeek, endWeek, validFilter ? users : null);

		res.json(bookings);
	},
};

export const bookingsNew = {
	auth: "RW",
	method: "POST",
	route: "/bookings",
	body: ({ req }) =>
		v.pipe(
			v.object({
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
				user: v.fallback(v.pipe(v.string(), v.trim(), v.nonEmpty()), req.session.user.id),
				location: v.pipe(v.string(), v.trim(), v.nonEmpty()),
			}),
			v.check(input => {
				if (input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		const user = await db.getUser(req.body.user);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		if (user.isAdmin && !req.body.endTime) {
			return res.status(400).json({ error: "Admins must provide end time" });
		}
		//Converts from milliseconds
		let startTime = dayjs(req.body.startTime);
		let endTime = dayjs(req.body.endTime);

		if (startTime.isBefore(dayjs())) {
			return res.status(400).json({ error: "Invalid time" });
		}
		if (!req.body.location) {
			return res.status(400).json({ error: "Location is required" });
		}

		if (!req.body.endTime) endTime = null;
		//Database want seconds
		let booking = await db.addBooking(user.id, startTime.unix(), endTime.unix(), req.body.location);
		res.status(200).json(booking);
	},
};

export const bookingsId = {
	auth: "RO",
	route: "/bookings/:id",
	async handler(req, res) {
		const booking = await db.getBooking(req.params.id);
		if (!booking) return res.status(404).json({ error: "Booking not found" });
		res.json(booking);
	},
};

export const bookingsIdEdit = {
	auth: "RW",
	method: "POST",
	route: "/bookings/:id",
	body: ({ req }) =>
		v.pipe(
			v.object({
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
				user: v.fallback(v.pipe(v.string(), v.trim(), v.nonEmpty()), req.session.user.id),
			}),
			v.check(input => {
				if (input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		let booking = await db.getBooking(req.params.id);

		if (!booking) {
			res.status(404).json({ error: "Booking not found" });
			return;
		}

		if (booking.userId != req.body.user.id) {
			res.status(403).send({ error: "Not authorized" });
			return;
		}
		const user = await db.getUser(req.body.user);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user.isAdmin && !req.body.endTime) {
			return res.status(400).json({ error: "Admins must provide end time" });
		}

		let startTime = dayjs(req.body.startTime);
		let endTime = dayjs(req.body.endTime);

		if (startTime.isBefore(dayjs())) {
			return res.status(400).json({ error: "Invalid time" });
		}

		if (!req.body.endTime) endTime = null;

		let newBooking = await db.editBooking(booking.id, startTime, endTime);
		res.status(200).json(newBooking);
	},
};

export const bookingsIdDelete = {
	auth: "RW",
	method: "DELETE",
	route: "/bookings/:id",
	body: ({ req }) =>
		v.object({
			user: v.fallback(v.pipe(v.string(), v.trim(), v.nonEmpty()), req.session.user.id),
		}),
	async handler(req, res) {
		let booking = await db.getBooking(req.params.id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		const user = await db.getUser(req.body.user);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (booking.userId != req.body.user.id && !user.isAdmin) {
			return res.status(403).json({ error: "Not authorized" });
		}

		await db.deleteBooking(req.params.id);
		res.status(204).send();
	},
};
