export class User {
	constructor(opt) {
		this.id = opt.id;
		this.uid = opt.uid;
		this.username = opt.username;
		this.name = opt.name;
		this.surname = opt.surname;
		this.printableName = opt.printableName;
		this.seconds = opt.seconds;
		this.inlab = opt.inlab;
		this.hasKey = opt.hasKey;
		this.groups = opt.groups;
	}

	get isAdmin() {
		if (this.groups === undefined) {
			return false;
		}
		return this.groups.includes("soviet");
	}
}

export class Session {
	/**
	 *
	 * @param {'user'|'api'} type
	 * @param {User|Api} entity
	 */
	constructor(type, entity) {
		/**
		 * @type {'user'|'api'}
		 */
		this.type = type;
		if (this.isUser) {
			/**
			 * @type {User}
			 */
			this.user = entity;
		} else if (this.isApi) {
			/**
			 * @type {Api}
			 */
			this.api = entity;
		}
	}

	get isUser() {
		return this.type == "user";
	}

	get isApi() {
		return this.type == "api";
	}

	get isReadOnly() {
		if (this.isUser) return false;
		else if (this.isApi) return this.api.readOnly;
	}

	get isAdmin() {
		if (this.isUser) return this.user.isAdmin;
		else if (this.isApi) return this.api.admin;
	}
}

export class Booking {
	constructor(userId, time, hasKey) {
		this.userId = userId;
		this.time = time;
		this.hasKey = hasKey;
	}
}
