import * as v from "valibot";

import { db } from "../index.js";

export const audits = {
	auth: 'RO',
	route: "/audits",
	async handler(req, res) {
        let userId = req.body.user ?? null;
        let dateInput = req.body.dateString;
        let baseDate = dayjs(dateInput);
        if (!baseDate.isValid()) {
            baseDate = dayjs(); // current week is not valid
        }
        const startWeek = baseDate.startOf("isoWeek").unix(); // in seconds
        const endWeek = baseDate.endOf("isoWeek").unix();

        let weekAudit = await db.getAudits(startWeek, endWeek, userId);
        res.json(weekAudit);
	},
};

export const auditsId = {
    auth: 'RO',
    route: "/audits/:id",
    async handler(req, res) {
        let audit = await db.getAudit(req.params.id);
        if (!audit) {
            return res.status(404).json("Audit not found");
        }
        res.json(audit);
    }
}

export const auditsIdNew = {
    auth: 'RW',
    method: 'POST',
    route: "/audits",
    body: v.pipe(
        v.object({
            user: v.nullish(v.string()),
            approved: v.boolean(),
            motivation: v.nullish(v.pipe(v.string(), v.trim(), v.nonEmpty())),
            location: v.nullish(v.string()),
            startTime: v.nullish(v.pipe(
                v.union([
                    v.pipe(v.string(), v.transform(Number.parseInt), v.check((v) => !Number.isNaN(v))),
                    v.number()
                ]),
                v.transform(Math.round)
            ])),
            endTime: v.nullish(v.pipe(
                v.union([
                    v.pipe(v.string(), v.transform(Number.parseInt), v.check((v) => !Number.isNaN(v))),
                    v.number()
                ]),
                v.transform(Math.round)
            ]))
        }),
        v.check((input) => {
            if (input.startTime && input.endTime) {
                return input.startTime < input.endTime;
            }
            return true;
        }, "The end time must be greater than the start time.")
    ),
    async handler(req, res) {
        if (!req.session.isAdmin) {
            req.body.approved = false;
            if (req.user && req.user != req.session.user.id) {
                return res.status(403).json({ error: "Can't add audit for another user" });
            }
        }

        // TODO: rework this logic
        const alLog = await db.alreadyLogged(req.body.userId);

        if (alLog != null) {
            if (req.body.motivation == null) {
                return res.status(400).json({ error: "Must provide motivation at logout"});
            }
            let audits = await db.addExit(alLog.id, Math.floor(Date.now() / 1000), req.body.motivation);

            return res.json(audits);
        }

        let location = db.getLocation(req.body.location);

        if (!location) {
            return res.status(404).json({ error: "Location not found"});
        }

        let audits = await db.addEntrance(
            req.body.user,
            req.body.startTime,
            req.body.endTime,
            location.id,
            req.body.motivation,
            req.body.approved,
        );

        res.json(audits);
    }
}

router.patch("/audits/:id", authRW, async (req, res) => {
	let startTime, endTime, motivation, location;
	let approved = false;
	if (req.session.isAdmin) approved = true;

	let audit = await db.getAudit(req.params.id);

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

	if (req.body.startTime != null) {
		startTime = req.body.startTime;
	} else {
		startTime = audit.startTime;
	}

	if (req.body.endTime != null) {
		endTime = req.body.endTime;
	} else {
		endTime = audit.endTime;
	}

	if (req.body.motivation != null) {
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

	let audits = await db.editAudit(
		req.params.id,
		startTime,
		endTime,
		motivation,
		approved,
		location,
	);
	res.status(200).json(audits);
});

router.delete("/audits/:id", authRW, async (req, res) => {
	let audit = await db.getAudit(req.params.id);

	if (!audit) {
		res.status(404).send("Audit not found");
		return;
	}

	if ((audit.userid != req.session.user.id || audit.approved) && !req.session.isAdmin) {
		res.status(403).send("Not authorized");
		return;
	}

	await db.deleteAudit(req.params.id);
	res.status(204).send();
});