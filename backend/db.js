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
                WHERE starttime>=${startWeek} AND endtime<=${endWeek};`;
        }
        return this.db.run`
                SELECT userid, starttime, endtime
                FROM booking
                WHERE starttime >= ${startWeek} 
                        AND endtime <= ${endWeek}
                        AND userid IN (${sql(users)});`;
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

    // #region location
    /**
     * 
     * @param {string} id 
     */
    async getLocation(id){
        const location = await db.oneOrNone(`
            SELECT * 
            FROM "location"
            WHERE id = $1
        `, [id]);
        return location;
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
    addEntrance(userId, time, locationId, approved){
        return this.db.run`
			    INSERT INTO "audit" (userId, startTime, location, approved) 
                VALUES (${userId}, ${time}, ${locationId}, ${approved});
		        RETURNING *`
    }

    /**
     * 
     * @param {string} userId
     * @param {number} time     exit time
     * @param {boolean} approved
     * @param {string} motivation   mandatory
     */
    async addExit(userId, time, approved, motivation){
        let entrance = await this.db.oneOrNone(`
            SELECT * FROM "audit"
            WHERE "userId" = $1 AND "startTime" = (
                SELECT MAX("startTime")
                FROM "audit"
                WHERE "userId" = $1 AND "endTime" IS NULL AND startTime < $2
            )
            ORDER BY "startTime" DESC;
        `, [userId, time]);
        if (entrance){
            let approval = approved && entrance.approved;
            return this.db.run`
                UPDATE audit SET endTime = ${time},
                                 approved = ${approval},
                                 motivation = ${motivation}
                WHERE id = ${entrance} RETURNING *;`;
        } else {
            res.status(400).json({error: "The entrance has not been registered."});
        }
    }

    async getAudit(id){
        const audit = await db.oneOrNone( `SELECT * 
        FROM "audit"
        WHERE id = $1`, [id]);
        return audit;
    }

    editAudit(id, updates) {
        let query = 'UPDATE "audit" SET';
        const values = [];
        let index = 1;
    
        for (const field in updates) {
            if (index > 1) query += `,`;
            query += ` ${field} = $${index}`;
            values.push(updates[field]);
            index++;
        }
        query += ` WHERE id = $${index} RETURNING *;`;
        values.push(id);
 
        return this.db.query(query, values);
    }
    
    /**
     * 
     * @param {number=} start 
     * @param {number=} end 
     * @param {string[]=} users 
     */
    getAudits(start, end, users){
        let query = `SELECT * FROM "audit"`;
        const values = [];
        let index = 1;
        let conditions = [];

        if (!isNaN(start)) {
            conditions.push(`start = $${index}`);
            values.push(start);
            index++;
        }
        if (!isNaN(end)) {
            conditions.push(`end = $${index}`);
            values.push(end);
            index++;
        }
        if (users != null && users.length != 0) {
            const userPlaceholders = users.map((x, i) => `$${index + i}`).join(", ");
            conditions.push(`userid IN (${userPlaceholders})`);
            values.push(...users);
            index += users.length;
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        query += `;`;

        return this.db.run(query, values);
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

