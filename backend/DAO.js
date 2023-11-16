import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('grillo.db', (err) => { if (err) throw err; });
// USER table
db.run('CREATE TABLE IF NOT EXISTS user (id STRING PRIMARY KEY, minutes INTEGER, inlab BOOLEAN, lastUpdate TIMESTAMP, lastMinutes INTEGER, hasKey BOOLEAN)');
// AUDIT table
db.run('CREATE TABLE IF NOT EXISTS audit (user_id STRING, time DATETIME, enter BOOLEAN, motivation TEXT, PRIMARY KEY (user_id, time), FOREIGN KEY(user_id) REFERENCES user(id))');
//BOOKING table
db.run('CREATE TABLE IF NOT EXISTS booking (user_id STRING, time DATETIME, PRIMARY KEY (user_id, time), FOREIGN KEY(user_id) REFERENCES user(id))');
//CIT table
db.run('CREATE TABLE IF NOT EXISTS cit (user_id STRING, phrase TEXT, id INTEGER PRIMARY KEY, FOREIGN KEY(user_id) REFERENCES user(id))');

export function addBooking(user_id, time) {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO booking (user_id, time) VALUES (?, ?);";
        db.run(sql, [user_id, time], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(null);
        });
    })

}