import "vuetify/styles";
import { createVuetify } from "vuetify";
import "@mdi/font/css/materialdesignicons.css";
import { aliases, mdi } from "vuetify/iconsets/mdi";

const WEEEThemeDark = {
	dark: true,
	colors: {
		background: "#181818",
		surface: "#222222",
		primary: "#00B612",
		secondary: "#008633",
		error: "#DA0027",
		info: "#1472BD",
		success: "#00B612",
		warning: "#C97000",
	},
};

export default createVuetify({
	theme: {
		defaultTheme: "WEEEThemeDark",
		themes: {
			WEEEThemeDark,
		},
	},
	icons: {
		defaultSet: "mdi",
		aliases,
		sets: {
			mdi,
		},
	},
});
