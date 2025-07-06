import config from "./config.js";

import { io } from "socket.io-client";
import { spawn } from "child_process";

const socket = io.connect(config.serverUrl, {
	auth: {
		token: config.apiToken,
	},
});

socket.on("connect", async () => {
	console.log("Connected");
	try {
		const res = await socket.emitWithAck("joinLocation", { locationId: config.location });
		if (res.error) {
			console.log("Error joining room", res.error);
		} else {
			console.log("Successfully joined " + res.location);
		}
	} catch (e) {
		console.log(e);
	}
});

socket.on("disconnect", () => {
	console.log("Disconnected");
});

socket.on("error", error => {
	console.error(error);
});

socket.on("connect_error", error => {
	console.error(error);
});

socket.on("ring", ack => {
	ack();
	console.log("Ring ring");
	const ffplay = spawn("ffplay", [config.audioFilePath, "-nodisp", "-autoexit"]);
	ffplay.on("exit", code => {
		console.log(`ffplay exited with code ${code}`);
	});
});
