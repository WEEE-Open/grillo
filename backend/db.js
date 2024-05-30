import postgres from 'postgres';
import { Booking } from './models.js';
import dayjs from 'dayjs';

import Ldap from './ldap.js';

export class Database {
    constructor(config) {
        this.db = postgres(config.db); // see db structure at https://drawsql.app/teams/none-217/diagrams/grillo
        this.ldap = new Ldap(config.ldap);
    }

    connect() {
        return this.ldap.connect();
    }

    // #region booking

    async addBooking(userId, startTime, endTime) {
        if (endTime == NaN){
            return this.db.run`
			    INSERT INTO booking (userId, startTime) 
                VALUES (${userId}, ${startTime});
		        `
        }
		return this.db.run`
			INSERT INTO booking (userId, startTime, endTime) 
            VALUES (${userId}, ${startTime}, ${endTime});
		`
    }

    async getBookings(startWeek, endWeek, users){
        return this.db.run`
                SELECT userid, starttime, endtime
                FROM booking
                WHERE starttime>=${startWeek} && endtime<=${endWeek};
        `
    }

    deleteBooking(userId, time) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM booking WHERE userId = ? AND time = ?;";
            // add error or warning in case the values are not in the db
            this.db.run(sql, [userId, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    // #endregion

    // #region user

	addUserIfNotExists(userId) {
		return this.db`
			INSERT INTO "user" (id, seconds, inlab, lastupdate, lastseconds) VALUES (${userId}, 0, FALSE, 0, 0)
			ON CONFLICT(id) DO NOTHING;
		`  // some of this is temporary
	}



    // ADD THE ADMIN FIELD FOR THE USER
    getUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM user WHERE id=?;";
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log(row)
                resolve(new User(row.id, row.seconds, row.inlab, row.lastUpdate, row.lastSeconds, row.hashKey));
            });
        });
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

