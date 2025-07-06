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
			readonly: v.boolean(),
			admin: v.boolean(),
			description: v.pipe(v.string(), v.trim(), v.nonEmpty()),
		}),
		v.check(input => !(input.readonly && input.admin)),
	),
	async handler(req, res) {
		let result = await db.generateApiToken(req.body.readonly, req.body.admin, req.body.description);
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
	route: "/tokens/:id",
	async handler(req, res) {
		await db.deleteApiToken(req.params.id);
		res.sendStatus(204);
	},
};
