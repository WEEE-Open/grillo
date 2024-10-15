import config from './config.js';
import express, { query } from 'express';
import { db, io } from './index.js';
import dayjs from 'dayjs';
import cookieParser from 'cookie-parser';


const router = express.Router();
router.use(cookieParser());

router.use(async (req, res, next) => {
	if (req.cookies && req.cookies.session) {
		let session = await db.getSessionByCookie(req.cookies.session);
		if (session) {
			req.session = session;
		}
	}
	if (!req.session && req.get('Authorization') != undefined) {
		let [type, token] = req.get('Authorization').split(' ')[1];
		if (type != 'Bearer') { // this is in preparation for future in case we want to move to jwt or something else
			res.status(400).send('Invalid Authorization header');
			return;
		}
		let session = await db.validateApiToken(token);
		if (session) {
			req.session = session;
		}
	}
	next();
});

const loggedIn = express.Router({mergeParams: true});
loggedIn.use((req, res, next) => {
	if (!req.session) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}
	
	if (req.session.blocked) {
		res.status(423).json({ error: "User blocked" });
		return;
	}
	
	next();
});

const admin = express.Router({mergeParams: true});
admin.use(async (req, res, next) => {
	if (!req.session.isAdmin) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}
	next();
});

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

loggedIn.get('/user', async (req, res) => {
    res.json(req.user);
});

loggedIn.delete('/user/session', async (req, res) => {
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

loggedIn.get('/lab/info', (req, res) => {
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
loggedIn.post('/lab/ring', async (req, res) => {
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

// router.get('/bookings'); done
// router.post('/bookings/new'); done
// router.post('/bookings/:id');   //to edit a booking
// router.delete('/bookings/:id');

//router.get('/audits');

loggedIn.get('/stats');

loggedIn.get('/notifications/new');
loggedIn.post('/notification/:id');   //to edit a notification
loggedIn.delete('/notification/:id');

loggedIn.post('/notification/:id/read');
loggedIn.post('/notification/:id/delivered');

loggedIn.get('/tokens');
loggedIn.post('/tokens/new');
loggedIn.delete('/bookings/:id');

loggedIn.get('/events');
loggedIn.post('/events/new');
loggedIn.post('/events/:id');
loggedIn.delete('/events/:id');

// #region bookings

/*
    Create a booking
*/
loggedIn.post('/bookings/new', async (req, res) => {
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
loggedIn.get('/bookings', async (req, res) => {
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
loggedIn.delete('/bookings/:id', async (req, res) => {
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
loggedIn.post('/bookings/:id', async (req, res) => {
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
loggedIn.post('/lab/in', async (req, res) => {
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
loggedIn.post('/lab/out', async(req, res) => {
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
loggedIn.patch('/audits/:id', async(req, res) => {
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
loggedIn.get('/audits', async (req, res) => {
    let start = parseInt(req.query.start);
    let end = parseInt(req.query.end);
    let users = req.query.user.split(",");


    const audits = getAudits(start, end, users);
    res.json(audits);
});


// #endregion


router.use(loggedIn);
loggedIn.use(admin);

export default router;