import { argv } from "./index.js";

const config = {
	port: 3000,
	db: "postgres://grillo:WEEEOpen@db/grillo", // postgres://username:password@host:port/database
	ldap: {
		test: false || !argv.prod, // will return demo data instead of actually opening a connection
		url: 'ldap://ldap',
		timeout: 3000,
		username: 'cn=grillo,ou=Services,dc=example,dc=test',
		password: 'password',
		userDn: 'ou=People,dc=example,dc=test',
		updateCron: "0 * * * * *",
	}
};


export default config;