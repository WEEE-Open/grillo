import * as v from "valibot";
import dayjs from "../day.js";

import { db } from "../index.js";

export const bookings = {
	auth: 'RO',
	route: "/bookings",
	async handler(req, res) {
        let unixDate = parseInt(req.params.date);
        if (unixDate) unixDate = null;
        else unixDate *= 1000;
		let date = dayjs(unixDate);
        startWeek = date.startOf("isoWeek").unix();
		endWeek = date.endOf("isoWeek").unix();

        if (req.params.user == null || req.body.user == undefined) {
            userId = null;
        } else {
            userId = req.body.user;
        }

        let user = db.getUser(userId);
        if (!user) {
            return req.status(404).json({ error: 'User not found'});
        }

        const bookings = await db.getBookings(startWeek, endWeek, userId);
        res.json(bookings);
	},
};

export const bookingsNew = {
    auth: 'RW',
    method: 'POST',
    route: '/bookings',
    body: v.pipe(
        v.object({
            startTime: v.integer(),
            endTime: v.nullish(v.integer()),
        }),
        v.check((input) => {
            if (input.endTime) {
                return input.startTime < input.endTime;
            }
            return true;
        }, "The end time must be greater than the start time.")
    ),
    async handler(req, res) {
        if (req.session.isAdmin && !req.body.endTime) {
            return res.status(400).json({ error: "Admins must provide end time"});
        }

        let startTime = dayjs(req.body.startTime);
        let endTime = dayjs(req.body.endTime);

        if (startTime.isBefore(dayjs())) {
            return res.status(400).json({ error: "Invalid time" });
        }

        if (!req.body.endTime) endTime = null;

        let booking = await db.addBooking(req.session.user.id, inTime, endTime);
        res.status(200).json(booking);
    }
}

export const bookingsId = {
    auth: 'RO',
    route: '/bookings/:id',
    async handler(req, res) {
        const booking = await db.getBooking(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    }
}

export const bookingsIdEdit = {
    auth: 'RW',
    method: 'POST',
    body: v.object({}), // TODO, lo stesso del bookingNew
    async handler(req, res) {
        let booking = await db.getBooking(req.params.id);

        if (!booking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        if (booking.userid != req.session.user.id) {
            res.status(403).send({ error: "Not authorized" });
            return;
        }

        if (req.session.isAdmin && !req.body.endTime) {
            return res.status(400).json({ error: "Admins must provide end time"});
        }

        let startTime = dayjs(req.body.startTime);
        let endTime = dayjs(req.body.endTime);

        if (startTime.isBefore(dayjs())) {
            return res.status(400).json({ error: "Invalid time" });
        }

        if (!req.body.endTime) endTime = null;

        let newBooking = await db.editBooking(booking.id, inTime, endTime);
        res.status(200).json(newBooking);
    }
}

export const bookingsIdDelete = {
    auth: 'RW',
    method: 'DELETE',
    route: '/bookings/:id',
    async handler(req, res) {
        let booking = await db.getBooking(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.userId != req.session.user.id && !req.session.isAdmin) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await db.deleteBooking(req.params.id);
        res.status(204).send();
    }
}