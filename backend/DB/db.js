import sqlite3 from 'sqlite3'

export class Database {
    constructor(path) {
        this.path = path;
        this.db = new sqlite3.Database(this.path, async (err) => { if (err) throw err; })
    }


    // #region booking

    addBooking(user_id, time) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO booking (user_id, time) VALUES (?, ?);";
            this.db.run(sql, [user_id, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    deleteBooking(user_id, time) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM booking WHERE user_id = ? AND time = ?;";
            // add error or warning in case the values are not in the db
            this.db.run(sql, [user_id, time], (err) => {
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

    getUser(user_id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM user WHERE id=?;";
            this.db.get(sql, [user_id], (err, row) => {
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

    deleteAudit(user_id, time, enter, motivation) {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM audit WHERE user_id = ? AND time = ?;";

            this.db.run(sql, [user_id, time], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    addEntrance(user_id, time, enter) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO audit (user_id, time, enter, motivation) VALUES (?, ?, ?, '');";

            this.db.run(sql, [user_id, time, enter], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        })
    }

    addExit(user_id, time, enter, motivation) {
        return new Promise(async (resolve, reject) => {
            const sql_time = "SELECT time FROM audit WHERE user_id = ? and enter = true ORDER BY time DESC LIMIT 1;"
            this.db.get(sql_time, [user_id], (err, row) => {
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
                this.db.run(sql_update, [delta_time, user_id], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const sql = "INSERT INTO audit (user_id, time, enter, motivation) VALUES (?, ?, ?, ?);";

                    this.db.run(sql, [user_id, time, enter, motivation], (err) => {
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

                this.db.run('CREATE TABLE IF NOT EXISTS audit (user_id STRING, time DATETIME, enter BOOLEAN, motivation TEXT, PRIMARY KEY (user_id, time), FOREIGN KEY(user_id) REFERENCES user(id))'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

                this.db.run('CREATE TABLE IF NOT EXISTS booking (user_id STRING, time DATETIME, PRIMARY KEY (user_id, time), FOREIGN KEY(user_id) REFERENCES user(id))'
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });

                this.db.run('CREATE TABLE IF NOT EXISTS cit (user_id STRING, phrase TEXT, id INTEGER PRIMARY KEY, FOREIGN KEY(user_id) REFERENCES user(id))'
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

