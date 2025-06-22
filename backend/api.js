import config from './config.js';
import express, { query } from 'express';
import { db, io } from './index.js';
import { authAdmin, authRO, authRW, validateSession } from './authorization.js';
import dayjs from 'dayjs';
import cookieParser from 'cookie-parser';
import Time from './time.js';

import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const router = express.Router();
router.use(cookieParser());

router.use(validateSession);

router.get('/ping', async (req, res) => {
	res.send('pong');
	console.log("Ciao mondo!");
	//res.json(await db.generateToken(true, false, "weeetofono"));
});

if (config.testMode) {
	router.get('/user/session', async (req, res) => {
		if (req.query.uid) {
			let user = await db.getUser(req.query.uid);
			if (user) {
				let cookie = await db.generateCookieForUser(user.id, `${req.ip} - ${req.get('User-Agent')}`);
				res.cookie('session', cookie);
				res.redirect('/api/v1/user/session'); // prevent reloading from generating a new cookie
				return;
			}
		}
		let page = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test mode</title>
		</head>
		<body>
			${(req.session) ? `<h2>Already authenticated as ${req.session.user.name}</h2>` : ''}
			<h2>Select a user to switch account</h2>
			<ul>`;
		let users = await db.getUsers();
		for (let user of users) {
			page += `<li><a href="?uid=${user.id}">${user.name}</a></li>`;
		}
		page += `
			</ul>
		</body>
		</html>`;
		res.send(page);
	});
} else {
	router.get('/user/session', async (req, res) => {
		if (req.session) {
			res.status(400).send('Already authenticated');
			return;
		}
		if (!req.query.code) {
			res.redirect(config.ssoRedirect);
			return;
		}
		// TODO: validate sso and return a session cookie
		res.sendStatus(501); // temp
	});
}

router.get('/user', authRW, async (req, res) => {
	console.log(req.session);
	res.json(req.session);
});

router.delete('/user/session', authRW, async (req, res) => {
	if (req.session.type == 'api') {
		if (req.session.isAdmin) {
			await db.deleteApiKey(req.session.id);
			res.sendStatus(204);
			return;
		}
		res.status(403).send('Forbidden');
		return;
	}
	await db.deleteCookie(req.cookies.session);
	res.clearCookie('session');
	res.sendStatus(204);
});

router.get('/lab/info', authRO, (req, res) => {
	/// ecc

	res.json({
		isLabOpen: labOpen(),
		people: userInLab(),
		nextOpening: nextOpening()
	})
});
// audit
//router.post('/lab/in');
//router.post('/lab/out'); 
router.post('/lab/ring', authRW, async (req, res) => {
	if (req.session.isReadOnly) {
		res.status(403).send('Forbidden');
		return;
	}
	try {
		await io.timeout(10000).emitWithAck('ring'); // in the future perhaps we can add a parameter to specify which bell to ring
		res.sendStatus(204);
	} catch (error) {
		res.status(503).send('No response from WEEETofono');
		return;
	}
});

function toUnixTimestamp(dateString) {
	if (dateString == undefined) {
		return NaN;
	}
	// Se è già un timestamp UNIX (numero), restituiscilo direttamente
	if (!isNaN(dateString)) return Number(dateString);

	// Prova a parsare come ISO 8601
	let timestamp = dayjs(dateString);
	if (timestamp.isValid()) {
		return timestamp.unix();
	}

	// Prova a parsare come formato "DD/MM/YYYY HH:mm"
	const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
	if (match) {
		const [, day, month, year, hours, minutes] = match.map(Number);
		const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		timestamp = dayjs(formattedDate);
		if (timestamp.isValid()) {
			return timestamp.unix();
		}
	}

	// Se il formato non è valido, restituisci NaN
	return NaN;
}


// region events

router.get('/events', authRW, async (req, res) => {
	const event = await db.getEvents();

	if (!event) {
		return res.status(500).json({ error: "No events found" });
	}

	res.status(200).json(event);
});

router.post('/events/new', authAdmin, async (req, res) => {
	const exevent = await db.getEvent(req.body.id);
	
	if (exevent) {
		return res.status(400).json({ error: "L'ID della location esiste già" });
	}

	let event = await db.addEvent(req.body.id, toUnixTimestamp(req.body.startTime), toUnixTimestamp(req.body.endTime), req.body.title, req.body.description);
	res.status(200).json(event);
});

router.get('/events/:id', authAdmin, async (req, res) => {

	let event = await db.getEvent(req.params.id);
	if (!event) {
		return res.status(500).json({ error: "No events found" });
	}
	res.status(200).json(event);
});

router.post('/events/:id', authAdmin, async (req, res) => {

	let event = await db.getEvent(req.params.id);

	var startTime = toUnixTimestamp(req.body.startTime);
	var endTime = toUnixTimestamp(req.body.endTime);
	if (endTime == NaN) endTime = null;
	let editedEvent = await db.editEvent(event.id, startTime, endTime, req.body.title, req.body.description);
	res.status(200).json(editedEvent);
});


router.delete('/events/:id', authAdmin, async (req, res) => {
	const eventId = req.params.id;
	const deletedEvent = await db.deleteEvent(eventId);

	if (!deletedEvent) {
		return res.status(404).json({ error: "Event not found" });
	}

	res.status(200).json("Deleted :)");
});

// #ENDREGION

// #region bookings

/*
	Create a booking
*/
router.post('/bookings/new', authRW, async (req, res) => {

	var inTime = toUnixTimestamp(req.body.startTime);
	var endTime = toUnixTimestamp(req.body.endTime);

	if (isNaN(inTime) || dayjs.unix(inTime).isBefore(dayjs())) {
		res.status(400).json({ error: "Invalid time" });
		return;
	}


	if (req.session.isAdmin && isNaN(endTime)) {
		res.status(400).json({ error: "Gli admin DEVONO inserire una data di uscita" });
		return;
	}

	if (isNaN(inTime) && dayjs.unix(inTime).isAfter(dayjs.unix(endTime))) {
		res.status(400).json({ error: "End time is before start time" });
		return;
	}

	if (endTime == NaN) endTime = null;
	let booking = await db.addBooking(req.session.user.id, inTime, endTime);
	res.status(200).json(booking);
});

/*
	Get all bookings of this week or a given week
*/
router.get('/bookings', authRO, async (req, res) => {


	let date = toUnixTimestamp(req.body.dateString);
	let userId;
	let startWeek;
	let endWeek;

	if (!isNaN(date)) {
		startWeek = date.startOf('isoWeek').unix();
		endWeek = date.endOf('isoWeek').unix();
	} else {
		startWeek = dayjs().startOf('isoWeek').unix();
		endWeek = dayjs().endOf('isoWeek').unix();
	}
	if (req.body.user == null || req.body.user == undefined) {
		userId = null;
	} else {
		userId = req.body.user;
	}


	const bookings = await db.getBookings(startWeek, endWeek, userId);
	res.json(bookings);

});

/*
	Get a booking given the id
*/
router.get('/bookings/:id', authRO, async (req, res) => {
	const bookings = await db.getBooking(req.params.id);
	res.json(bookings);

});

/*
	Delete a booking
*/
router.delete('/bookings/:id', authRW, async (req, res) => {
	let booking = await db.getBooking(req.params.id);
	console.log(req.session.isAdmin);
	if (booking.userId != req.session.user.id && !req.session.isAdmin) {
		res.status(403).send("Not authorized");
		return;
	}
	await db.deleteBooking(req.params.id);
	res.status(204).send();
});

/*
	Edit a booking
*/
router.post('/bookings/:id', authRW, async (req, res) => {
	let booking = await db.getBooking(req.params.id);

	// Booking non trovato
	if (!booking) {
		res.status(404).send("Booking not found");
		return;
	}

	// Autorizzazione
	if (booking.userid != req.session.user.id && !req.session.isAdmin) {
		res.status(403).send("Not authorized");
		return;
	}

	// Validazione input
	const inTime = toUnixTimestamp(req.body.startTime);
	const endTime = toUnixTimestamp(req.body.endTime);

	if (isNaN(inTime) || dayjs.unix(inTime).isBefore(dayjs())) {
		res.status(400).json({ error: "Invalid time" });
		return;
	}

	if (!isNaN(endTime) && dayjs.unix(inTime).isAfter(dayjs.unix(endTime))) {
		res.status(400).json({ error: "End time is before start time" });
		return;
	}

	const finalEndTime = isNaN(endTime) ? null : endTime;

	await db.editBooking(booking.id, inTime, finalEndTime);
	res.sendStatus(200);
});

// region lab

/**
 * 	Create entrace
 * 
 * Body contains:
 * (number) userId
 * (number) startTime
 * (string) locationId
 */
router.post('/lab/in', authRW, async (req, res) => {
	var user = req.body.userId;
	var inTime = parseInt(req.body.startTime);
	var location = getLocation(req.body.locationId);
	if (!req.user.isAdmin && req.user.id != user) {
		res.status(400).json({ error: "Invalid user" });
		return;
	}
	if (!location) {
		res.status(400).json({ error: "Invalid location" });
		return;
	}
	if (inTime == NaN) {
		res.status(400).json({ error: "Invalid time" });
		return;
	}
	if (alreadyLogged) {
		res.status(400).json({ error: "User already logged in" });
		return;
	}
	let audit = await addEntrance(user, inTime, req.body.idLocation, req.user.isAdmin);
	res.status(200).json(audit);
});

/**
 * Create exit
 * 
 * Body contains:
 * (int) outTime
 * (string) motivation mandatory
 */
router.post('/lab/out', authRW, async (req, res) => {
	var user = req.body.userId;
	var outTime = parseInt(req.body.outTime);
	if (!req.user.isAdmin && req.user.id != user) {
		res.status(400).json({ error: "Invalid user" });
		return;
	}

	if (outTime == NaN) {
		res.status(400).json({ error: "Invalid time" });
		return;
	}
	await bookingToDelete(user, inTime);
	let audit = await addExit(req.user.id, outTime, req.user.isAdmin, req.body.motivation);
	res.status(200).json(audit);
})
// region audits

/*
// inizio fine settimana
function getMonday(d) {
	d = new Date(d);
	var day = d.getDay(),
		diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
	return new Date(d.setDate(diff));
}

function getSunday(fromDate = new Date()) {
	const date = new Date(fromDate); 
	const day = date.getDay();       
	const diff = (7 - day) % 7;      
	date.setDate(date.getDate() + diff);
	return date;
}
*/

/**
 * get audit
 * 
 * Body can contain:
 * {number=} startTime 
 * {number=} endTime
 * {string=} motivation
 * {boolean=} approved
 * {string=} location 
 */

//ritorna solo la settimana corrente
router.get('/audits', authRW, async (req, res) => {


	startWeek = dayjs().startOf('isoWeek').unix();
	endWeek = dayjs().endOf('isoWeek').unix();


	if (req.body.user == null || req.body.user == undefined) {
		userId = null;
	} else {
		userId = req.body.user;
	}


	let weekAudit =await db.getAudits(startWeek, endWeek, userId);
	res.status(200).json(weekAudit);
})

dayjs.extend(isoWeek);

//returns given date week, if userId is present it also gives only the user
router.post('/audits', authRW, async (req, res) => {
	let userId = req.body.user ?? null;
	let dateInput = req.body.dateString;
	let baseDate = dayjs(dateInput);
	if (!baseDate.isValid()) {
		baseDate = dayjs(); // settimana corrente se la data non è valida
	}
	const startWeek = baseDate.startOf('isoWeek').unix(); // in secondi
	const endWeek = baseDate.endOf('isoWeek').unix();

	let weekAudit = await db.getAudits(startWeek, endWeek, userId);
	res.status(200).json(weekAudit);
});

router.get('/audit/:id', authRW, async (req, res) => {
		
	let audit =await db.getAudit(req.params.id);
	if (!audit) {
		res.status(404).send("Audit not found");
		return;
	}
	res.status(200).json(audit);
})
/*
router.post('/audits/new', authRW, async (req, res) => {

	let inTime = toUnixTimestamp(req.body.startTime);
	let endTime = toUnixTimestamp(req.body.endTime);
	let approved = false;

	if (endTime == NaN) endTime = null;
	if (req.session.isAdmin) approved = true;
	if (alreadyLogged(req.body.userId) != null) {
		res.status(500).json("already logged");
	}

	let audits = await db.addEntrance(req.body.id, inTime, endTime, req.body.locationId, approved);
	res.status(200).json(audits);
});*/

//usato per entrare ed uscire 
router.post('/audits/new', authRW, async (req, res) => {

	let inTime = toUnixTimestamp(req.body.startTime);
	let endTime = toUnixTimestamp(req.body.endTime);
	let approved = false;
	let motivation = req.body.motivation;
	if (inTime == undefined || isNaN(endTime)) inTime = Math.floor(Date.now() / 1000);
	if (endTime == undefined || isNaN(endTime)) endTime = null;
	if (motivation == undefined ) motivation = null;
	if (req.session.isAdmin) approved = true;
	

	const alLog=await db.alreadyLogged(req.body.userId);

	if (alLog != null) {

		let audits = await db.addExit(alLog.id, 
		Math.floor(Date.now() / 1000), motivation);

		res.status(200).json(audits);
		return
	}

	let audits = await db.addEntrance(req.body.userId, inTime, endTime, req.
	body.locationId, motivation, approved);

	res.status(200).json(audits);
});

router.patch('/audits/:id', authRW, async (req, res) => {
	let startTime, endTime, motivation, location;
	let approved = false;
	if (req.session.isAdmin) approved = true;

	let audit = await db.getAudit(req.params.id)

	if (audit == null || audit == NaN) {
		res.status(500).json("req audit not found");
		return;
	}
	if (audit.userid != req.session.user.id && !req.session.isAdmin) {
		res.status(403).send("Not authorized");
		return;
	}
	if (req.session.isAdmin && req.body.approved) {
		approved = true;
		return;
	}

	if ( req.body.startTime != null) {
		startTime = req.body.startTime;
	} else {
		startTime = audit.startTime;
	}

	if (req.body.endTime != null) {
		endTime = req.body.endTime;
	} else {
		endTime = audit.endTime;
	}

	if ( req.body.motivation != null) {
		motivation = req.body.motivation;
	} else {
		motivation = audit.motivation;
	}

	if (req.body.location != null) {
		location = req.body.location;
	} else {
		location = audit.location;
	}
	console.log(req.params);

	let audits = await db.editAudit(req.params.id, startTime, endTime, motivation, approved, location);
	res.status(200).json(audits);
});



router.delete('/audits/:id', authRW, async (req, res) => {
	let audit =await db.getAudit(req.params.id);

	if (!audit) {
		res.status(404).send("Audit not found");
		return;
	}

	if ((audit.userid != req.session.user.id || audit.approved) && (!req.session.isAdmin)) {
		res.status(403).send("Not authorized");
		return;
	}

	await db.deleteAudit(req.params.id);
	res.status(204).send();
});


// #endregion

// region locations

router.get('/locations', authRO, async (req, res) => {
	const locations = await db.getLocations();
	if (!locations) {
		return res.status(500).json({ error: "No locations found" });
	}

	res.status(200).json(locations);
});

router.post('/locations/new', authAdmin, async (req, res) => {
	const existingLocation = await db.getLocation(req.body.id);
	console.log(existingLocation);
	if (existingLocation != null) {
		return res.status(400).json({ error: "L'ID della location esiste già" });
	}

	let location = await db.addLocation(req.body.id, req.body.name);
	res.status(200).json(location);
});

router.patch('/locations/:id', authAdmin, async (req, res) => {
	let locationsid = req.params.id;
	let location = await db.getLocation(locationsid);
	if (!location) {
		res.status(400).json({ error: "Invalid location id" });
		return;
	}

	let name = req.body.name;
	let edLocation = await db.editLocation(locationsid, name);
	res.status(200).json(edLocation);
});

router.delete('/locations/:id', authAdmin, async (req, res) => {
	res.status(501).send();
});

// #endregion

export default router;