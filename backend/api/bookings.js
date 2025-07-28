import * as v from "valibot";
import dayjs from "../day.js";

import { db } from "../index.js";

export const bookings = {
	auth: "RO",
	route: "/bookings/:date",
	async handler(req, res) {
		
		if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Not authenticated" });
    }
	    let userId = req.session.user.id;
		
		let unixDate = parseInt(req.params.date, 10);
		if (String(unixDate).length === 10) unixDate *= 1000;
		let date = dayjs(unixDate);
		const startWeek = date.startOf("isoWeek").unix();
		const endWeek = date.endOf("isoWeek").unix();

		/*
		let user = await db.getUser(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		*/
		

		const bookings = await db.getBookings(startWeek, endWeek, [userId]);
		res.json(bookings);
	},
};

export const bookingsNew = {
	auth: "RW",
	method: "POST",
	route: "/bookings",
	body: () =>
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
			}),
			v.check(input => {
				if (input.endTime) {
					return input.startTime < input.endTime;
				}
				return true;
			}, "The end time must be greater than the start time."),
		),
	async handler(req, res) {
		if (req.session.isAdmin && !req.body.endTime) {
			return res.status(400).json({ error: "Admins must provide end time" });
		}

		let startTime = dayjs(req.body.startTime);
		let endTime = dayjs(req.body.endTime);

		if (startTime.isBefore(dayjs())) {
			return res.status(400).json({ error: "Invalid time" });
		}

		if (!req.body.endTime) endTime = null;

		let booking = await db.addBooking(req.session.user.id, startTime, endTime);
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
	body: () =>
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

		if (booking.userId != req.session.user.id) {
			res.status(403).send({ error: "Not authorized" });
			return;
		}

		if (req.session.isAdmin && !req.body.endTime) {
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
	async handler(req, res) {
		let booking = await db.getBooking(req.params.id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		if (booking.userId != req.session.user.id && !req.session.isAdmin) {
			return res.status(403).json({ error: "Not authorized" });
		}

		await db.deleteBooking(req.params.id);
		res.status(204).send();
	},
};
