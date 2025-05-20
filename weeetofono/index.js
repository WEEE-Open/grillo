import config from "./config.js";

import { io } from "socket.io-client";
import { spawn } from "child_process";

const socket = io.connect(config.serverUrl, {
	auth: {
		token: config.apiToken,
	},
});

socket.on("connect", () => {
	console.log("Connected");
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
