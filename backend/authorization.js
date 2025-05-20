import { db } from "./index.js";

export async function validateSession(req, res, next) {
	if (req.cookies && req.cookies.session) {
		let session = await db.getSessionByCookie(req.cookies.session);
		if (session) {
			req.session = session;
		}
	}
	if (!req.session && req.get("Authorization") != undefined) {
		let [type, token] = req.get("Authorization").split(" ")[1];
		if (type != "Bearer") {
			// this is in preparation for future in case we want to move to jwt or something else
			res.status(400).send("Invalid Authorization header");
			return;
		}
		let session = await db.validateApiToken(token);
		if (session) {
			req.session = session;
		}
	}
	next();
}

export function authRO(req, res, next) {
	if (!req.session) {
		res.status(401).json({ error: "Unauthorized" });
		return false;
	}

	if (req.session.blocked) {
		res.status(423).json({ error: "User blocked" });
		return false;
	}

	next();
}

export function authRW(req, res, next) {
	authRO(req, res, () => {
		next(); // TODO: check read-only flag
	});
}

export function authAdmin(req, res, next) {
	authRW(req, res, () => {
		if (!req.session.isAdmin) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}
		next();
	});
}
