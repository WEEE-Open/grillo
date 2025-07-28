import postgres from "postgres";
import bcrypt from "bcrypt";
import { User, ApiToken, Session, Booking } from "./models.js";
import dayjs from "dayjs";

import Ldap from "./ldap.js";
import { generateRandomString } from "./utils.js";

export class Database {
	constructor(config) {
		this.apiKeySaltRounds = config.apiKeySaltRounds;
		this.db = postgres(config.db); // see db structure at https://drawsql.app/teams/none-217/diagrams/grillo
		this.ldap = new Ldap(config.ldap);
		this.ldap.on("usersUpdate", this.updateDatabaseUsersTable.bind(this));
	}

	connect() {
		return this.ldap.connect();
	}

	async updateDatabaseUsersTable(users) {
		let oldUsers = (await this.getUsers()).map(user => user.id);
		let newUsers = users.map(user => user.id);
		let usersToAdd = newUsers.filter(user => !oldUsers.includes(user));
		let usersToDelete = oldUsers.filter(user => !newUsers.includes(user));
		for (let user of usersToAdd) {
			await this.addUserIfNotExists(user);
		}
		for (let user of usersToDelete) {
			await this.deleteUser(user);
		}
	}

	// #region booking
	/**
	 *
	 * @param {string} userId
	 * @param {number} startTime
	 * @param {number=} endTime
	 * @returns
	 */
	async addBooking(userId, startTime, endTime) {
		if (endTime == null) {
			return this.db`
				INSERT INTO booking ("userId", "startTime") 
                VALUES (${userId}, ${startTime});
		        RETURNING *`;
		}
		return this.db`
			INSERT INTO booking ("userId", "startTime", "endTime") 
            VALUES (${userId}, ${startTime}, ${endTime}) 
            RETURNING *;
		`;
	}

	/**
	 *
	 * @param {number} startWeek
	 * @param {number} endWeek
	 * @param {string[]=} users
	 * @param {string=} location
	 * @returns
	 */
	async getBookings(startWeek, endWeek, users, location) {
 		const result = await this.db`
			SELECT "userId", "startTime", "endTime"
			FROM booking
			WHERE "startTime" >= ${startWeek} 
			AND ("endTime" <= ${endWeek} OR "endTime" IS NULL)
			${users && users.length > 0 ? this.db`AND "userId" IN ${this.db(users)}` : this.db``}
			${location ? this.db`AND location = ${location}` : this.db``};`;
		return result;
	}

	async getBooking(id) {
		const result = await this.db`
            SELECT *
            FROM booking
            WHERE id = ${id}
            LIMIT 1;`;
		return result[0];
	}

	/**
	 *
	 * @param {number} id
	 * @returns
	 */
	async deleteBooking(id) {
		return this.db`
                DELETE FROM booking
                WHERE id = ${id};`;
	}

	/**
	 *
	 * @param {number} id
	 * @param {number} startTime
	 * @param {number=} endTime
	 * @returns
	 */
	async editBooking(id, startTime, endTime) {
		return this.db`
                UPDATE booking SET "startTime" = ${startTime}, "endTime" = ${endTime} WHERE id = ${id} RETURNING *;`;
	}

	// #endregion

	// #region user

	addUserIfNotExists(userId) {
		return this.db`
			INSERT INTO "user" (id, seconds) VALUES (${userId}, 0)
			ON CONFLICT(id) DO NOTHING;
		`;
	}

	async getUsers() {
		let dbData = await this.db`
            SELECT * FROM "user";
        `;
		let ldapData = await this.ldap.getUsers();
		return dbData.map(dbUser => {
			let ldapUser = ldapData.find(ldapUser => ldapUser.id == dbUser.id);
			return new User({
				...ldapUser,
				...dbUser,
			});
		});
	}

	async getUsersInLocation(locationId) {
		let dbData = await this.db`
            SELECT * FROM "user"
			WHERE activeLocation = ${locationId};
        `;
		let ldapData = await this.ldap.getUsers();
		return dbData.map(dbUser => {
			let ldapUser = ldapData.find(ldapUser => ldapUser.id == dbUser.id);
			return new User({
				...ldapUser,
				...dbUser,
			});
		});
	}

	async getUser(userId) {
		let dbData = await this.db`
			SELECT * FROM "user" WHERE id = ${userId};
		`;
		if (dbData.length == 0) {
			return null;
		}
		dbData = dbData[0];
		let ldapData = await this.ldap.getUser(dbData.id);
		if (ldapData == null) {
			return null;
		}
		return new User({
			...ldapData,
			...dbData,
		});
	}

	deleteUser(userId) {
		return this.db`
            DELETE FROM "user" WHERE id = ${userId};
        `;
	}

	async generateCookieForUser(userId, description) {
		while (true) {
			let cookie =
				Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			try {
				await this.db`
					INSERT INTO cookie ("cookie", "userId", "description") VALUES (${cookie}, ${userId}, ${description});
				`;
				return cookie;
			} catch (e) {
				if (e.code != "23505") {
					throw e;
				}
			}
		}
	}

	async getSessionByCookie(cookie) {
		let user = await this.db`
			SELECT "userId" FROM cookie WHERE cookie = ${cookie};
		`;
		if (user.length == 0) {
			return null;
		}
		let userData = await this.getUser(user[0].userId);
		return new Session("user", userData);
	}

	deleteCookie(cookie) {
		return this.db`
			DELETE FROM cookie WHERE cookie = ${cookie};
		`;
	}

	// #endregion

	// #region api token

	async getApiTokens() {
		return this.db`
			SELECT * FROM "token";
		`.then(res => res.map(t => new ApiToken(t)));
	}

	async getApiToken(id) {
		let dbData = await this.db`
			SELECT * FROM "token" WHERE id = ${id};
		`;
		if (dbData.length == 0) {
			return null;
		}
		return new ApiToken(dbData[0]);
	}

	async validateApiToken(token) {
		let [id, hash] = token.split(":");
		if (!id || !hash) {
			return null;
		}
		let dbData = await this.getToken(id);
		if (dbData == undefined || !(await bcrypt.compare(hash, dbData.hash))) {
			return null;
		}
		return new Session("api", dbData);
	}

	async deleteApiToken(id) {
		return this.db`
			DELETE FROM "token" WHERE id = ${id};
		`;
	}

	async generateApiToken(readOnly, isAdmin, description) {
		while (true) {
			let token = generateRandomString();
			let password = generateRandomString();
			let hash = await bcrypt.hash(password, this.apiKeySaltRounds);
			try {
				await this.db`
					INSERT INTO "token" ("id", "hash", "readOnly", "admin", "description") VALUES (${token}, ${hash}, ${readOnly}, ${isAdmin}, ${description});
				`;
				return { token, password, fullString: `${token}:${password}` };
			} catch (e) {
				if (e.code != "23505") {
					throw e;
				}
			}
		}
	}

	// #endregion

	// #region location
	/**
	 *
	 * @param {string} id
	 * @param {string} name
	 */

	async getLocations() {
		const location = await this.db`
            SELECT * 
            FROM "location"
        `;
		let defaultLocation = await this.getConfig("defaultLocation");
		return location.map(l => {
			if (l.id == defaultLocation) l.default = true;
			return l;
		});
	}

	async getLocation(id) {
		let location = await this.db`
            SELECT * 
            FROM "location"
            WHERE id = ${id}
        `;
		if (location.length == 0) return null;
		location = location[0];
		let defaultLocation = await this.getConfig("defaultLocation");
		if (defaultLocation == location.id) location.default = true;
		return location;
	}

	async addLocation(id, name) {
		const result = await this.db`
            INSERT INTO location (id, name)
            VALUES (${id}, ${name})
            RETURNING *;
        `;
		return result[0];
	}

	async editLocation(id, name) {
		const result = await this.db`
            UPDATE location
            SET name = ${name}
            WHERE id = ${id}
            RETURNING *;
        `;
		return result[0];
	}
	async deleteLocation(id) {
		const result = await this.db`
        DELETE FROM location
        WHERE id = ${id}
        RETURNING *;
		`;
		return result[0];
	}

	// #endregion

	// #region audit
	/**
	 *
	 * @param {string} userId
	 * @param {number} time
	 * @param {string} locationId
	 * @param {boolean} approved
	 */
	async addAudit(userId, timeIn, timeOut, locationId, summary, approved) {
		if (timeOut == null) {
			return (
				await this.db`
				INSERT INTO audit ("userId", "startTime", "location", "approved")  
                VALUES (${userId}, ${timeIn},${locationId},${approved})
		        RETURNING *;`
			)[0];
		}

		return this.db`
			INSERT INTO "audit" ("userId", "startTime", "endTime", "location", "summary", "approved") 
			VALUES (${userId}, ${timeIn}, ${timeOut}, ${locationId}, ${summary},${approved})
			RETURNING *;`[0];
	}

	async getActiveAudit(userId) {
		return (
			(
				await this.db`
		SELECT id FROM audit 
		WHERE "userId" = ${userId} AND "endTime" IS NULL 
		ORDER BY "startTime" DESC
		LIMIT 1
	`
			)[0] ?? null
		);
	}

	/**
	 *
	 * @param {string} userId
	 * @param {number} startTime
	 */
	async bookingToDelete(userId, startTime) {
		let today = new Date(startTime);
		let tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		const startDay = Math.floor(today.getTime() / 1000);
		const endDay = Math.floor(tomorrow.getTime() / 1000);
		let toDelete = await this.db.run`SELECT id FROM "booking"
                                    WHERE userId = ${userId} 
                                        AND startTime >= ${startDay}
                                        AND startTime < ${endDay}
                                        AND startTime = (SELECT MIN(startTime)
                                                        FROM "booking"
                                                        WHERE userId = ${userId} 
                                                        AND startTime >= ${startDay}
                                                        AND startTime < ${endDay})`;
		if (toDelete.rows && toDelete.rows.length > 0) {
			const toDeleteId = res.rows.map(row => row.id);
			this.deleteBooking(toDeleteId);
		}
	}

	async getAudit(id) {
		return (
			(
				await this.db`
		SELECT * 
		FROM audit
		WHERE id = ${id}
	`
			)[0] ?? null
		);
	}

	async editAudit(id, startTime, endTime, summary, approved, location) {
		return this.db`
		UPDATE audit SET "startTime" = ${startTime}, "endTime" = ${endTime}, "summary" = ${summary}, "approved" = ${approved}, "location" =${location} WHERE id = ${id} RETURNING *;`;
	}

	/**
	 *
	 * @param {number=} start
	 * @param {number=} end
	 * @param {string[]=} users
	 */
	async getAudits(startWeek, endWeek, users) {
		if (users == null || users.length == 0) {
			return this.db`
                SELECT *
                FROM audit
                WHERE "startTime">=${startWeek} AND "endTime"<=${endWeek};`;
		}
		return this.db`
                SELECT *
                FROM audit
                WHERE "startTime" >= ${startWeek} 
                        AND "endTime" <= ${endWeek}
                        AND "userId" IN (${this.db(users)});`;
	}

	deleteAudit(auditId) {
		return this.db`
            DELETE FROM audit WHERE id = ${auditId};
        `;
	}

	// #endregion

	// #region stats
	// select a single user (not multiple)
	getStats(startTime, endTime, user) {
		return new Promise((resolve, reject) => {
			let sql = `SELECT A1.userId, SUM(time(A2.time) - time(A1.time)) as stat
            FROM audit A1, audit A2 
            WHERE A1.userId = A2.userId AND CAST(A1.time AS DATE) = CAST(A2.time AS) AND A1.enter = 1 AND A2.enter = 0 AND A1.time < A2.time
            AND A2.time = (SELECT MIN(time) FROM audit A WHERE A.userId = A1.userId AND A1.time < A.time)`;

			let param = [];
			if (startTime != null) {
				sql += " AND date(A1.time) >= ?";
				param.push(startTime);
			}
			if (endTime != null) {
				sql += " AND date(A2.time) <= ?";
				param.push(endTime);
			}
			sql += " GROUP BY A1.\"userId\"";
			if (user != null) {
				sql += " HAVING A1.\"userId\" = ?";
				param.push(user);
			}
			this.db.all(sql, param, (err, rows) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(rows);
			});
		});
	}

	// #endregion

	// #region events
	/**
	 *
	 * @param {string} id
	 * @param {number} startTime
	 * @param {number=} endTime
	 * @param {string} title
	 * @param {string=} description
	 */

	async getEvents() {
		const event = await this.db`
            SELECT * 
            FROM "event";
        `;
		return event;
	}

	async getEvent(id) {
		const event = await this.db`
            SELECT * 
            FROM "event"
            WHERE id = ${id};
        `;
		return event[0];
	}

	async addEvent(startTime, endTime, title, description) {
		const event = await this.db`
            INSERT INTO event
            VALUES (DEFAULT,${startTime},${endTime},${title},${description})
            RETURNING *;
        `;
		return event[0];
	}

	async editEvent(id, startTime, endTime, title, description) {
		const event = await this.db`
        UPDATE event
        SET "startTime"=${startTime}, "endTime"=${endTime}, "title"=${title}, "description"=${description}
        WHERE id = ${id}
        RETURNING *;
    `;
		return event[0];
	}

	async deleteEvent(id) {
		const event = await this.db`
            DELETE FROM event
            WHERE id = ${id}
            RETURNING *;
        `;

		return event[0];
	}

	// #endregion

	// #region codes

	/**
	 *
	 * @param {string} code
	 * @param {string=} userId
	 * @param {number} expirationTime
	 */

	async generateCode(userId) {
		const code = generateRandomString();
		const expirationTime = parseInt(Date.now() / 1000 + 60); //one minute expiration time
		if (userId === undefined) {
			return await this.db`
				INSERT INTO codes ("code", "expirationTime") 
				VALUES (${code}, ${expirationTime}) 
				RETURNING *;`;
		} else {
			return await this.db`
				INSERT INTO codes ("code", "userId", "expirationTime") 
				VALUES (${code}, ${userId}, ${expirationTime}) 
				RETURNING *;`;
		}
	}

	async getCode(code) {
		const userId = await this.db`
			SELECT *
			FROM codes
			WHERE code = ${code}
		`;
		return userId[0] ?? null;
	}

	async assignCode(code, userId) {
		return await this.db`
			UPDATE codes
			SET "userId" = ${userId}
			WHERE code = ${code}
		`;
	}

	async deleteCode(code) {
		return await this.db`
			DELETE FROM codes
			WHERE code = ${code}`;
	}

	async getConfig(id) {
		let values = await this.db`
			SELECT value
			FROM config
			WHERE id = ${id}
			LIMIT 1`;
		if (values.length == 0) return null;
		return values[0].value;
	}

	async setConfig(id, value) {
		return await this.db`
			INSERT INTO config (id, value)
			VALUES (${id}, ${value})
			ON CONFLICT (id) DO UPDATE SET value = ${value}`;
	}

	// #endregion

	// #region db-management

	close() {
		this.db.close(err => {
			if (err) {
				console.error(err.message);
			}
		});
	}

	// #endregion
}
