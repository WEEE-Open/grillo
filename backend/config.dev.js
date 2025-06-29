const config = {
	testMode: true, // will bypass login and show you a menu to select a user
	ssoRedirect: "https://sso.example.com/login?redirect=grillo.example.com/login",
	port: 3000,
	db: "postgres://grillo:WEEEOpen@db/grillo", // postgres://username:password@host:port/database
	ldap: {
		test: true, // will return demo data instead of actually opening a connection
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
		{
			link: "https://tarallo.weeeopen.it/",
			icon: "mdi-circle-double",
			title: "Tarallo",
			subtitle:
				"Tuttofare Assistente il Riuso di Aggeggi Logori e Localmente Opprimenti (aka L'inventario Opportuno)",
		},
		{
			link: "https://crauto.weeeopen.it/",
			icon: "mdi-account-outline",
			title: "Crauto",
			subtitle: "Creatore e Rimuovitore Autogestito di Utenti che Tutto Offre",
		},
		{
			link: "https://cloud.weeeopen.it/",
			icon: "mdi-cloud-outline",
			title: "Cloud",
			subtitle: "Cumulatore Ludico Ostinatamente Utile di Dati",
		},
		{
			link: "https://wiki.weeeopen.it/",
			icon: "mdi-book-outline",
			title: "Wiki",
			subtitle: "Wisdom Integrata per la Konoscenza Illimitata",
		},
	],
};

export default config;
