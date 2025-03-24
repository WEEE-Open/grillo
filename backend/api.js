import config from './config.js';
import express, { query } from 'express';
import { db, io } from './index.js';
import { authAdmin, authRO, authRW, validateSession } from './authorization.js';
import dayjs from 'dayjs';
import cookieParser from 'cookie-parser';
import Time from './time.js';


const router = express.Router();
router.use(cookieParser());

router.use(validateSession);

router.get('/ping', async (req, res) => {
    res.send('pong');
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

router.delete('/user/session', authRW,async (req, res) => {
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
    // Dividere la stringa in giorno, mese, anno, ore e minuti
    const [day, month, year, hours, minutes] = dateString.match(/\d+/g).map(Number);

    // Riorganizzare la data nel formato ISO accettato da dayjs: "YYYY-MM-DDTHH:mm"
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Convertire in timestamp UNIX
    return dayjs(formattedDate).unix();
}

// region events

router.get('/events', authRW,async (req, res) => {
	const event = await db.getEvents();

	if (!event) {
		return res.status(500).json({ error: "No events found" });
	}

	res.status(200).json(event);
});

router.post('/events/new',authAdmin, async (req, res) => {
	const exevent = await db.getEvent(req.body.id);
	console.log("asd post new");
	if(exevent){
		return res.status(400).json({ error: "L'ID della location esiste già" });
	}

	let event = await db.addEvent(req.body.id,toUnixTimestamp(req.body.startTime),toUnixTimestamp(req.body.endTime), req.body.title, req.body.description);
	res.status(200).json(event);
});

router.get('/events/:id',authAdmin,async (req, res) => {
	console.log("asd get events id");
	let event = await db.getEvent(req.params.id);
	if (!event) {
		return res.status(500).json({ error: "No events found" });
	}
	res.status(200).json(event);
});

router.post('/events/:id',authAdmin,async (req, res) => {
	console.log("asd eventi id post");
	let event = await db.getEvent(req.params.id);
	
	var startTime = toUnixTimestamp(req.body.startTime);
	var endTime = toUnixTimestamp(req.body.endTime);
	if (endTime == NaN) endTime = null;
	let editedEvent = await db.editEvent(event.id, startTime, endTime, req.body.title, req.body.description);
	res.status(200).json(editedEvent);
});


router.delete('/events/:id',authAdmin, async (req,res)=> {
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
router.post('/bookings/new',authRW, async (req, res) => {
    var inTime = parseInt(req.body.startTime);
    var endTime = parseInt(req.body.endTime);

    if(inTime == NaN || dayjs.unix(inTime).isBefore(dayjs())){
        res.status(400).json({error: "Invalid time"});
        return;
    }
    if(endTime != NaN && dayjs.unix(inTime).isAfter(dayjs.unix(endTime))){
        res.status(400).json({error: "End time is before start time"});
        return;
    }
    if (endTime == NaN) endTime=null;
    let booking = await db.addBooking(req.body.user, inTime, endTime);
    res.status(200).json(booking);
});

/*
    Get all bookings
*/
router.get('/bookings',authRO, async (req, res) => {
    let week = parseInt(req.query.week);
    let year = parseInt(req.query.year);
    let users = req.query.user.split(",");
    let date = dayjs();
    if (week != NaN && year != NaN){
        date = date.year(year).isoWeek(week);
    } else if (week != NaN || year != NaN) {
        res.status(400).send("missing week/year");
        return;
    }
    let startWeek = date.startOf('isoWeek');
    let endWeek = date.endOf('isoWeek');

    const bookings = await db.getBookings(startWeek, endWeek, users);
    res.json(bookings);
});


/*
    Delete a booking
*/ 
router.delete('/bookings/:id',authRW, async (req, res) => {
    let booking = db.getBooking(req.params.id);
    if (booking.userId != req.user.id && !req.user.isAdmin){
        res.status(403).send("Not authorized");
        return;
    }
    await db.deleteBooking(req.params.id);
    res.status(204).send();
});

/*
    Edit a booking
*/ 
router.post('/bookings/:id',authRW, async (req, res) => {
    let booking = db.getBooking(req.params.id);
    if (booking.userId != req.user.id && !req.user.isAdmin){
        res.status(403).send("Not authorized");
        return;
    }
    var inTime = parseInt(req.body.startTime);
    var endTime = parseInt(req.body.endTime);

    if(inTime == NaN || dayjs.unix(inTime).isBefore(dayjs())){
        res.status(400).json({error: "Invalid time"});
        return;
    }
    if(endTime != NaN && dayjs.unix(inTime).isAfter(dayjs.unix(endTime))){
        res.status(400).json({error: "End time is before start time"});
        return;
    }
    if (endTime == NaN) endTime = null;
    await db.editBooking(booking.id, inTime, endTime);
    res.sendStatus(200).send();
});


// region audits

/**
 * 	Create entrace
 * 
 * Body contains:
 * (number) userId
 * (number) startTime
 * (string) locationId
 */
router.post('/lab/in',authRW, async (req, res) => {
	var user = req.body.userId;
    var inTime = parseInt(req.body.startTime);
	var location = getLocation(req.body.locationId);
	if (!req.user.isAdmin && req.user.id != user){
		res.status(400).json({error: "Invalid user"});
        return;
	}
	if (!location){
		res.status(400).json({error: "Invalid location"});
        return;
	}
    if(inTime == NaN){
        res.status(400).json({error: "Invalid time"});
        return;
    }
	if (alreadyLogged){
		res.status(400).json({error: "User already logged in"});
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
router.post('/lab/out',authRW, async(req, res) => {
	var user = req.body.userId;
	var outTime = parseInt(req.body.outTime);
	if (!req.user.isAdmin && req.user.id != user){
		res.status(400).json({error: "Invalid user"});
        return;
	}

    if(outTime == NaN){
        res.status(400).json({error: "Invalid time"});
        return;
    }
	await bookingToDelete(user, inTime);
    let audit = await addExit(req.user.id, outTime, req.user.isAdmin, req.body.motivation);
    res.status(200).json(audit);
})

/**
 * Edit audit
 * 
 * Body can contain:
 * {number=} startTime 
 * {number=} endTime
 * {string=} motivation
 * {boolean=} approved
 * {string=} location 
 */
router.patch('/audits/:id',authRW, async(req, res) => {
	let auditId = req.params.id;
	let audit = getAudit(auditId);
	if (!audit){
		res.status(400).json({error: "Invalid audit id"});
        return;
	}
	if (!req.user.isAdmin){
		res.status(400).json({error: "Operation not allowed"});
        return;
	}
	let startTime = parseInt(req.body.startTime);
	let endTime = parseInt(req.bpdy.endTime);
	if (startTime == NaN)	startTime = audit.startTime;
	if (endTime == NaN)		endTime = audit.endTime;
	if (dayjs.unix(inTime).isAfter(dayjs.unix(endTime))){
		res.status(400).json({error: "Invalid time"});
        return;
	}
	let params = req.body;
	let edAudit = editAudit(auditId, params);
	res.status(200).json(edAudit);
})

/**
 * Show audits
 * 
 * {number=} start
 * {number=} end
 * {sring[]=} users
 */
router.get('/audits',authRO, async (req, res) => {
    let start = parseInt(req.query.start);
    let end = parseInt(req.query.end);
    let users = req.query.user.split(",");


    const audits = getAudits(start, end, users);
    res.json(audits);
});


// #endregion

// region locations

router.get('/locations',authRO,async (req, res) =>{
	const locations = await db.getLocations();
	if (!locations) {
		return res.status(500).json({ error: "No locations found" });
	}

	res.status(200).json(locations);
});

router.post('/locations/new',authAdmin,async (req, res) =>{
	const existingLocation = await db.getLocation(req.body.id);
	console.log("asd");
	if (existingLocation) {
		return res.status(400).json({ error: "L'ID della location esiste già" });
	}

	let location = await db.addLocation(req.body.id, req.body.name);
    res.status(200).json(location);
});

router.patch('/locations/:id',authAdmin,async (req, res) =>{
	let locationsid = req.params.id;
	let location = db.getLocation(locationsid);
	if (!location){
		res.status(400).json({error: "Invalid location id"});
        return;
	}
	
	let name = req.body.name;
	let edLocation = await db.editLocation(locationsid, name);
	res.status(200).json(edLocation); 
});

router.delete('/locations/:id',authAdmin,async (req, res) =>{
	res.status(501).send();
});

// #endregion

export default router;