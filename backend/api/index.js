import { Router } from "express";
import cookieParser from "cookie-parser";
import * as v from "valibot";

import { db } from "../index.js";
import { validateSession, authRO, authRW, authAdmin } from "../authorization.js";

import * as audits from "./audits.js";
import * as bookings from "./bookings.js";
import * as codes from "./codes.js";
import * as events from "./events.js";
import * as locations from "./locations.js";
import * as tokens from "./tokens.js";
import * as user from "./user.js";

const routes = {
	...audits,
	...bookings,
	...codes,
	...events,
	...locations,
	...tokens,
	...user,
};

const router = Router({ mergeParams: true });
router.use(cookieParser());
router.use(validateSession);

for (const routeId in routes) {
	let route = routes[routeId];
	route.method = route.method?.toLowerCase() || "get";
	let auth = null;
	switch (route.auth) {
		case "RO":
			auth = authRO;
			break;
		case "RW":
			auth = authRW;
			break;
		case "admin":
			auth = authAdmin;
			break;
		case "none": // not using default to prevent mistakes
			auth = (req, res, next) => next();
			break;
		default:
			throw `No auth policy set for "${route.route}" route`;
	}
	router[route.method](
		route.route,
		auth,
		async (req, res, next) => {
			if (["post", "put", "patch"].includes(route.method) && !route.unsafeBody) {
				if (!route.body)
					res.status(500).json({
						error: "Missing route body schema",
						solution:
							"Either specify a route.body at this endpoint or disable safe body with route.unsafeBody",
					});
				let validated = await v.safeParseAsync(route.body({ req, res }), req.body);
				if (!validated.success) {
					res
						.status(400)
						.json({ error: "Bad request", issues: validated.issues.map(i => i.message) });
					return;
				}
				req.body = validated.output;
			}
			next();
		},
		route.handler,
	);
}

export default router;
