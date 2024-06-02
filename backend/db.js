import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { Booking } from './models.js';
import dayjs from 'dayjs';

import Ldap from './ldap.js';

export class Database {
    constructor(config) {
		this.apiKeySaltRounds = config.apiKeySaltRounds;
        this.db = postgres(config.db); // see db structure at https://drawsql.app/teams/none-217/diagrams/grillo
        this.ldap = new Ldap(config.ldap);
        this.ldap.on('usersUpdate', this.updateDatabaseUsersTable.bind(this));
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
        if (endTime == null){
            return this.db.run`
			    INSERT INTO booking (userId, startTime) 
                VALUES (${userId}, ${startTime});
		        RETURNING *`
        }
		return this.db.run`
			INSERT INTO booking (userId, startTime, endTime) 
            VALUES (${userId}, ${startTime}, ${endTime}) 
            RETURNING *;
		`
    }

    /**
     * 
     * @param {number} startWeek 
     * @param {number} endWeek 
     * @param {string[]=} users 
     * @returns 
     */
    async getBookings(startWeek, endWeek, users){
        if (users == null || users.length == 0){
            return this.db.run`
                SELECT userid, starttime, endtime
                FROM booking
                WHERE starttime>=${startWeek} && endtime<=${endWeek};`;
        }
        return this.db.run`
                SELECT userid, starttime, endtime
                FROM booking
                WHERE starttime>=${startWeek} && endtime<=${endWeek}
                        userid IN ${ sql(users) };`;
    }

    async getBooking(id){
        return this.db.run`
                SELECT *
                FROM booking
                WHERE id = ${ id };`;
    }

    /**
     * 
     * @param {number} id 
     * @returns 
     */
    async deleteBooking(id) {
        return this.db.run`
                DELETE FROM booking
                WHERE id = ${ id };`;
    }

    /**
     * 
     * @param {number} id
     * @param {number} startTime 
     * @param {number=} endTime 
     * @returns 
     */
    async editBooking(id, startTime, endTime) {
        return this.db.run`
                UPDATE booking SET startTime = ${startTime}, endTime = ${endTime} WHERE id = ${id} RETURNING *;`;
    }

    // #endregion

    // #region user

	addUserIfNotExists(userId) {
		return this.db`
			INSERT INTO "user" (id, seconds, inlab) VALUES (${userId}, 0, FALSE)
			ON CONFLICT(id) DO NOTHING;
		`
	}

    async getUsers() {
        let dbData = await this.db`
            SELECT * FROM "user";
        `;
		let ldapData = await this.ldap.getUsers();
		return dbData.map(dbUser => {
			let ldapUser = ldapData.find(ldapUser => ldapUser.id == dbUser.id);
			return {
				...ldapUser,
				id: dbUser.id,
				seconds: dbUser.seconds,
				inlab: dbUser.inlab,
			};
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
		return {
			...ldapData,
			id: dbData.id,
			seconds: dbData.seconds,
			inlab: dbData.inlab,
		};
	}

    deleteUser(userId) {
        return this.db`
            DELETE FROM "user" WHERE id = ${userId};
        `
    }

    async generateCookieForUser(userId, description) {
		while (true) {
			let cookie = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			try {
				await this.db`
					INSERT INTO cookie (cookie, userId, description) VALUES (${cookie}, ${userId}, ${description});
				`;
				return cookie;
			} catch (e) {
				if (e.code != '23505') {
					throw e;
				}
			}
		}
    }

	async getUserByCookie(cookie) {
		let user = await this.db`
			SELECT userId FROM cookie WHERE cookie = ${cookie};
		`;
		if (user.length == 0) {
			return null;
		}
		return await this.getUser(user[0].userid);
	}

	deleteCookie(cookie) {
		return this.db`
			DELETE FROM cookie WHERE cookie = ${cookie};
		`;
	}

    // #endregion

	// #region api token

	async getTokens() {
		return this.db`
			SELECT * FROM "token";
		`;
	}

	async getToken(id) {
		let dbData = await this.db`
			SELECT * FROM "token" WHERE id = ${id};
		`;
		if (dbData.length == 0) {
			return null;
		}
		return dbData[0];
	}

	async validateApiToken(token) {
		let [id, hash] = token.split(':');
		if (!id || !hash) {
			return null;
		}
		let dbData = await this.getToken(id);
		if (dbData == undefined || !await bcrypt.compare(hash, dbData.hash)) {
			return null;
		}
		return {
			id: dbData.id,
			isReadOnly: dbData.readonly,
			isAdmin: dbData.isadmin
		};
	}

	async deleteToken(id) {
		return this.db`
			DELETE FROM "token" WHERE id = ${id};
		`;
	}

	async generateToken(readOnly, isAdmin, description) {
		while (true) {
			let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			let password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			let hash = await bcrypt.hash(password, this.apiKeySaltRounds);
			try {
				await this.db`
					INSERT INTO "token" (id, hash, readonly, admin, description) VALUES (${token}, ${hash}, ${readOnly}, ${isAdmin}, ${description});
				`;
				return { token, password, fullString: `${token}:${password}` };
			} catch (e) {
				if (e.code != '23505') {
					throw e;
				}
			}
		}
	}



	// #endregion

    // #region audit

    deleteAudit(userId, time) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM audit WHERE userId = ? AND time = ?;";

            this.db.run(sql, [userId, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    addEntrance(userId, time) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO audit (userId, time, enter, motivation) VALUES (?, ?, TRUE, NULL);";

            this.db.run(sql, [userId, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    addExit(userId, time, enter, motivation) {
        return new Promise(async (resolve, reject) => {
            const sql_time = "SELECT time FROM audit WHERE userId = ? and enter = true ORDER BY time DESC LIMIT 1;"
            this.db.get(sql_time, [userId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                const enter_time = new Date(row.time);
                const exit_time = new Date(time);
                // time spent in the lab (in seconds)
                const delta_time = (exit_time - enter_time) / 1000;
                console.log(enter_time, exit_time, delta_time);

                const sql_update = "UPDATE user SET seconds = seconds + ? WHERE id = ?;"
                this.db.run(sql_update, [delta_time, userId], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const sql = "INSERT INTO audit (userId, time, enter, motivation) VALUES (?, ?, ?, ?);";

                    this.db.run(sql, [userId, time, enter, motivation], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                });
            });
        })
    }


    /**
     * 
     * @param {Date} startTime 
     * @param {Date} endTime 
     * @returns 
     */
    // add the possibility to select the Audit of certain users
    // Add the possibility for admins to edit Audit
    getAudit(startTime, endTime, user) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT A1.userId, date(A1.time) AS date, time(A1.time) AS inTime, time(A2.time) AS outTime, A2.motivation
            FROM audit A1, audit A2 
            WHERE A1.userId = A2.userId AND CAST(A1.time AS DATE) = CAST(A2.time AS) AND A1.enter = 1 AND A2.enter = 0 AND A1.time < A2.time
            AND A2.time = (SELECT MIN(time) FROM audit A WHERE A.userId = A1.userId AND A1.time < A.time)`;

            let param = [];
            if (startTime != null){
                sql += " AND date(A1.time) >= ?";
                param.push(startTime);
            }
            if (endTime != null){
                sql += " AND date(A2.time) <= ?";
                param.push(endTime);
            }
            if (user != null){
                sql += " AND A1.userId = ?;";
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

    editAudit(userId, time, newTime, newMotivation){
        return new Promise((resolve, reject) => {
            let sql = `UPDATE audit
                    SET time = ?,
                        motivation = ?
                    WHERE userId = ? AND time = ?;`;

            this.db.all(sql, [time, newMotivation, userId, newTime], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });

        });
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
            if (startTime != null){
                sql += " AND date(A1.time) >= ?"
                param.push(startTime);
            }
            if (endTime != null){
                sql += " AND date(A2.time) <= ?"
                param.push(endTime);
            }
            sql += " GROUP BY A1.userId"
            if (user != null){
                sql += " HAVING A1.userId = ?";
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

    // #region db-management

    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    // #endregion

}

