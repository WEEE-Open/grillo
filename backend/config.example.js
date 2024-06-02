import { argv } from "./index.js";

const config = {
	testMode: false, // will bypass login and show you a menu to select a user
	port: 3000,
	db: "postgres://grillo:WEEEOpen@db/grillo", // postgres://username:password@host:port/database
	ldap: {
		test: false, // will return demo data instead of actually opening a connection
		url: 'ldap://ldap',
		timeout: 3000,
		username: 'cn=grillo,ou=Services,dc=example,dc=test',
		password: 'password',
		userDn: 'ou=People,dc=example,dc=test',
		updateCron: "0 * * * * *",
	}
};


export default config;