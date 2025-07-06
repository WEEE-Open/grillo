export const ping = {
	auth: "none",
	route: "/ping",
	async handler(req, res) {
		res.json({ pong: "asd" });
	},
};
