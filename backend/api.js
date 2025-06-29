import config from "./config.js";
import express from "express";
import { db, io } from "./index.js";
import { authAdmin, authRO, authRW, validateSession } from "./authorization.js";
import dayjs from "dayjs";
import cookieParser from "cookie-parser";
import { toUnixTimestamp } from "./utils.js";
import isoWeek from "dayjs/plugin/isoWeek.js";
dayjs.extend(isoWeek);

const router = express.Router();
router.use(cookieParser());

router.use(validateSession);

router.get("/ping", async (req, res) => {
	res.send("pong");
	console.log("Ciao mondo!");
	//res.json(await db.generateToken(true, false, "weeetofono"));
});

if (config.testMode) {
	router.get("/user/session", async (req, res) => {
		if (req.query.uid) {
			let user = await db.getUser(req.query.uid);
			if (user) {
				let cookie = await db.generateCookieForUser(
					user.id,
					`${req.ip} - ${req.get("User-Agent")}`,
				);
				res.cookie("session", cookie);
				res.redirect("/api/v1/user/session"); // prevent reloading from generating a new cookie
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
			${req.session ? `<h2>Already authenticated as ${req.session.user.name}</h2>` : ""}
			<h2>Select a user to switch account</h2>
			<ul>`;
		let users = await db.getUsers();
		for (let user of users) {
			page += `<li><a href="?uid=${user.id}">${user.name} (${user.groups.join(",")})</a></li>`;
		}
		page += `
			</ul>
		</body>
		</html>`;
		res.send(page);
	});
} else {
	router.get("/user/session", async (req, res) => {
		if (req.session) {
			res.status(400).send("Already authenticated");
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

router.get("/user", authRW, async (req, res) => {
	console.log(req.session);
	res.json(req.session);
});

router.delete("/user/session", authRW, async (req, res) => {
	if (req.session.type == "api") {
		if (req.session.isAdmin) {
			await db.deleteApiKey(req.session.id);
			res.sendStatus(204);
			return;
		}
		res.status(403).send("Forbidden");
		return;
	}
	await db.deleteCookie(req.cookies.session);
	res.clearCookie("session");
	res.sendStatus(204);
});

router.get("/lab/info", authRO, (req, res) => {
	/// ecc

	res.json({
		isLabOpen: labOpen(),
		people: userInLab(),
		nextOpening: nextOpening(),
	});
});
// audit
router.post("/lab/ring", authRW, async (req, res) => {
	if (req.session.isReadOnly) {
		res.status(403).send("Forbidden");
		return;
	}
	try {
		await io.timeout(10000).emitWithAck("ring"); // in the future perhaps we can add a parameter to specify which bell to ring
		res.sendStatus(204);
	} catch (error) {
		res.status(503).send("No response from WEEETofono");
		return;
	}
});

/*
   Delete a token by id
*/
router.delete("/tokens/:id", authAdmin, async (req, res) => {
	await db.deleteApiToken(req.params.id);
	res.status(200).send();
});

// region audits

router.post("/lab/in", authRW, async (req, res) => {
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

router.post("/lab/out", authRW, async (req, res) => {
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
});

export default router;
