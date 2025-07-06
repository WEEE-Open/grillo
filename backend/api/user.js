import * as v from "valibot";

import { db } from "../index.js";
import config from "../config.js";

export const user = {
	auth: "RO",
	route: "/user",
	async handler(req, res) {
		res.json(req.session);
	},
};

export const userSession = {
	auth: "none",
	route: "/user/session",
};

if (config.testMode) {
	userSession.handler = async (req, res) => {
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
	};
} else {
	userSession.handler = async (req, res) => {
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
	};
}

export const userSessionDelete = {
	auth: "RO",
	method: "DELETE",
	route: "/user/session",
	async handler(req, res) {
		if (req.session.type == "api") {
			return res.status(403).json({ error: "Forbidden" });
		}
		await db.deleteCookie(req.cookies.session);
		res.clearCookie("session");
		res.sendStatus(204);
	},
};
