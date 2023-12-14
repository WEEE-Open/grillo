import sqlite3 from 'sqlite3'
import { Booking } from '../models.js';
import dayjs from 'dayjs';

export class Database {
    constructor(path) {
        this.path = path;
        this.db = new sqlite3.Database(this.path, async (err) => { if (err) throw err; })
    }


    // #region booking

    addBooking(userId, time) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO booking (userId, time) VALUES (?, ?);";
            this.db.run(sql, [userId, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    getBookings(userId){
        return new Promise((resolve, reject) => {
            let params = [dayjs()];
            let sql = "SELECT u.id, b.time, u.hasKey FROM booking b, user u WHERE b.userId = u.id AND b.time > ?";
            if(userId){
                params.push(userId);
                sql = sql.concat(' AND userId = ?')
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                const bookings = rows.map(r => new Booking(r.userId, r.time, r.hasKey));
                resolve(bookings);
            });
        })
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

    deleteAudit(userId, time, enter, motivation) {
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
                // time in seconds
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

    // #endregion

    // #region db-management

    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('CREATE TABLE IF NOT EXISTS user (id STRING PRIMARY KEY, seconds INTEGER, inlab BOOLEAN, lastUpdate TIMESTAMP, lastSeconds INTEGER, hasKey BOOLEAN)'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

                this.db.run('CREATE TABLE IF NOT EXISTS audit (userId STRING, time DATETIME, enter BOOLEAN, motivation TEXT, PRIMARY KEY (userId, time), FOREIGN KEY(userId) REFERENCES user(id))'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

                this.db.run('CREATE TABLE IF NOT EXISTS booking (userId STRING, time DATETIME, PRIMARY KEY (userId, time), FOREIGN KEY(userId) REFERENCES user(id))'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

                this.db.run('CREATE TABLE IF NOT EXISTS cit (userId STRING, phrase TEXT, id INTEGER PRIMARY KEY, FOREIGN KEY(userId) REFERENCES user(id))'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

            });
        });
    };

    emptyTables() {
        return new Promise((resolve, reject) => {
            try {
                this.db.run('DELETE FROM user');

                this.db.run('DELETE FROM audit');

                this.db.run('DELETE FROM booking');

                this.db.run('DELETE FROM cit');

                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    // #endregion

}

