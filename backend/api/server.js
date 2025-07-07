import * as v from "valibot";

import { db } from "../index.js";
import conf from "../config.js";

export const ping = {
	auth: "none",
	route: "/ping",
	async handler(req, res) {
		res.json({ pong: "asd" });
	},
};

export const config = {
	auth: "RO",
	route: "/config",
	async handler(req, res) {
		res.json({
			defaultLocation: await db.getConfig("defaultLocation"),
			servicesLinks: conf.servicesLinks,
		});
	}
}

export const configEdit = {
	auth: 'admin',
	method: 'PATCH',
	route: "/config",
	body: () => v.objectAsync({
		defaultLocation: v.nullishAsync(v.pipeAsync(
			v.string(),
			v.trim(),
			v.nonEmpty(),
			v.checkAsync(async (location) => {
				return !!(await db.getLocation(location));
			})
		)),
	}),
	async handler(req, res) {
		if (!!req.body.defaultLocation) {
			db.setConfig("defaultLocation", req.body.defaultLocation);
		}
		res.json({
			defaultLocation: await db.getConfig("defaultLocation"),
			servicesLinks: conf.servicesLinks,
		});
	}
}
