import * as v from "valibot";
import QRCode from "qrcode";

import { db } from "../index.js";

export const codesNew = {
    auth: 'RW',
    method: 'POST',
    route: '/codes'
    body: v.any(),
    async handler(req, res) {
        let user = null;
        if (req.session.isUser) {
            user = req.session.user;
        }

        let code = await db.generateCode(user.id);
        res.json({ code });
    }
}

export const codes = {
    auth: 'RW',
    route: '/codes/:code',
    async handler(req, res) {
        let code = await db.getCode(req.params.code);
        if (!code) {
            return res.status(404).json({ error: "Code not found" });
        }

        res.json(code);
    }
}

export const codesUserSet = {
    auth: 'RW',
    method: 'POST',
    route: '/codes/:code',
    body: v.object({
        user: v.pipe(v.string()),
    }),
    async handler(req, res) {
        let code = await db.getCode(req.param.code);
        if (!code) {
            return req.status(404).json({ error: "Code not found" });
        }
        if (code.userid) {
            return res.status(403).send({ error: "Forbidden" });
        }
        await db.assignCode(req.params.code, req.session.user.id);
		res.sendStatus(204);
    }
}

export const codesDelete = {
    auth: 'RW',
    method: 'DELETE',
    route: '/codes/:code',
    async handler(req, res) {
        let code = await db.getCode(req.param.code);
        if (!code) {
            return req.status(404).json({ error: "Code not found" });
        }
        if (req.session.isUser && req.session.user.id != code.userid) {
            // TODO: probably in the future we should link the code to whoever generated and limit deletion to them, currently allowin only APIs and the user who is assigned to the code is just fine, codes last only a minute and once assigned can't be changed
            return res.status(403).send({ error: "Forbidden" });
        }
        await db.deleteCode(req.params.code);
        res.sendStatus(204);
    }
}

export const codesQr = {
    auth: 'RW',
    route: '/codes/:code/qr.png',
    async handler(req, res) {
        let imageParams = {
            type: "png",
            width: req.query.width || 300,
            margin: req.query.margin || 2,
        };
        res.set("Content-Type", "image/png");
        QRCode.toFileStream(res, req.params.code, imageParams);
    }
}