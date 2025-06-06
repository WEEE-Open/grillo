const config = {
	testMode: false, // will bypass login and show you a menu to select a user
	ssoRedirect: "https://sso.example.com/login?redirect=grillo.example.com/login",
	port: 3000,
	db: "postgres://grillo:WEEEOpen@db/grillo", // postgres://username:password@host:port/database
	ldap: {
		test: false, // will return demo data instead of actually opening a connection
		url: "ldap://ldap",
		timeout: 3000,
		username: "cn=grillo,ou=Services,dc=example,dc=test",
		password: "password",
		userDn: "ou=People,dc=example,dc=test",
		updateCron: "0 * * * * *",
	},
	apiKeySaltRounds: 10,
	sso: {
		secret: "asdasdasdasd",
		loginRedirect:
			"https://sso.example.com/login?redirect=grillo.example.com/login&response_type=code",
		codeValidation: "https://sso.example.com/validate?code=${code}",
	},
	servicesLinks: [
		//{
		//	link: "",
		//	icon: "", // from https://pictogrammers.com/library/mdi/ prefixed with mdi-
		//	title: "",
		//	subtitle: "",
		//},
		// [...]
	],
};

export default config;
