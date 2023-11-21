import sqlite3 from 'sqlite3'

export class Database{
    constructor(path){
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

    // #endregion

    // #region user
    
    getUser(user_id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM USER WHERE id=?;";
            this.db.get(sql, [user_id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log(row)
                resolve(new User(row.id, row.minutes, row.inlab, row.lastUpdate, row.lastMinutes, row.hashKey));
            });
        });
    }

    // #endregion

    // #region db-management

    close(){
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    createTables(){
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('CREATE TABLE IF NOT EXISTS user (id STRING PRIMARY KEY, minutes INTEGER, inlab BOOLEAN, lastUpdate TIMESTAMP, lastMinutes INTEGER, hasKey BOOLEAN)'
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
    
    insertData(){
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
    
                //users
    
                this.db.run("INSERT INTO user (id, minutes, inlab, lastUpdate, lastMinutes, hasKey) VALUES ('UID1', 0, false, '2023-11-21T09:54:08+00:00', 0, true)"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO user (id, minutes, inlab, lastUpdate, lastMinutes, hasKey) VALUES ('UID2', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO user (id, minutes, inlab, lastUpdate, lastMinutes, hasKey) VALUES ('UID3', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO user (id, minutes, inlab, lastUpdate, lastMinutes, hasKey) VALUES ('UID4', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
    
                //audits
    
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID2', '2023-11-21T09:54:08+00:00', true, '')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID3', '2023-11-21T09:54:08+00:00', true, '')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID1', '2023-11-21T09:54:08+00:00', true, '')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID4', '2023-11-21T09:54:08+00:00', true, '')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID2', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID3', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID4', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                this.db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID1', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
    
                //bookings
    
                this.db.run("INSERT INTO booking (user_id, time) VALUES ('UID2', '2023-11-21T09:54:08+00:00')"
                    , (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
    
                resolve()
            });
        })
    };
    
    emptyTables(){
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

