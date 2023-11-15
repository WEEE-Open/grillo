import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('grillo.db', (err) => { if (err) throw err; });
db.run('CREATE TABLE IF NOT EXISTS users (id STRING PRIMARY KEY, minutes INTEGER, inlab BOOLEAN, lastUpdate TIMESTAMP, lastMinutes INTEGER, HasKey BOOLEAN)');
db.run('CREATE TABLE IF NOT EXISTS audit (user_id STRING PRIMARY KEY, title TEXT,  content TEXT)');
db.run('CREATE TABLE IF NOT EXISTS booking (user_id STRING PRIMARY KEY, time TIMESTAMP SECONDARY KEY)');

export let addBooking = (user_id, time) => {
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
