import * as v from "valibot";

import { db } from "../index.js";

export const tokens = {
	auth: "admin",
	route: "/tokens",
	async handler(req, res) {
		let tokens = await db.getApiTokens();
		res.json(tokens);
	},
};

export const tokensNew = {
	auth: "admin",
	method: "POST",
	route: "/tokens",
	body: () => v.pipe(
		v.object({
			readOnly: v.fallback(v.boolean(), false),
			admin: v.fallback(v.boolean(), false),
			description: v.pipe(v.string(), v.trim(), v.nonEmpty()),
		}),
		v.check(input => !(input.readOnly && input.admin)),
	),
	async handler(req, res) {
		let result = await db.generateApiToken(req.body.readOnly, req.body.admin, req.body.description);
		res.json(result);
	},
};

export const tokensId = {
	auth: "admin",
	route: "/tokens/:id",
	async handler(req, res) {
		let token = await db.getApiToken(req.params.id);
		res.json(token);
	},
};

export const tokensIdDelete = {
	auth: "admin",
	mathod: "DELETE",
	route: "/tokens/:id",
	async handler(req, res) {
		await db.deleteApiToken(req.params.id);
		res.sendStatus(204);
	},
};
