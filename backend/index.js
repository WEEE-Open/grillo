import config from "./config.js";

import http from 'http';
import express from "express";
import { Server } from 'socket.io';
import yargs from "yargs";

export const argv = yargs(process.argv)
	.option("prod", {
		alias: "p",
		description: "Run in production mode",
		type: "boolean",
		default: false,
	})
	.help()
	.alias("help", "h").argv;

import api from "./api.js";
import { Database } from "./db.js";

export const db = new Database(config);
db.connect();

let app = express();
let server = http.Server(app);
export const io = new Server(server, {
	serveClient: false,
});
app.use(express.json());

app.use("/api/v1/", api);

io.use(async (socket, next) => { // putting this here (for now) because i wans't sure where else to put it
	const token = socket.handshake.auth.token;
	if (token && await db.validateApiToken(token) != null) {
		return next();
	}
	next(new Error("Authentication error"));
});

if (argv.prod) {
	app.use("/", express.static("../frontend/dist"));
	app.use((req, res) => {
		res.sendFile("../frontend/dist/index.html");
	});
}
// ! do NOT put anything after this otherwise they will be bypassed in prod
server.listen(config.port, () => {
	console.log(`Server started on port ${config.port}`);
});
