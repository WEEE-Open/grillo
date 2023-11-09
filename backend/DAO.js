import sqlite3 from 'sqlite3'


class DAO {

    constructor() {
        this.createDatabase()
        this.createTables();

    };
    // Connect to SQLite database (or create a new one if it doesn't exist)
    createDatabase() {
        this.db = new sqlite3.Database('myDatabase.db');
    }

    createTables() {
        // Create a table named 'users'
        this.db.run('CREATE TABLE IF NOT EXISTS users (id STRING PRIMARY KEY, minutes INTEGER, inlab BOOLEAN, lastUpdate TIMESTAMP, lastMinutes INTEGER, HasKey BOOLEAN)');

        // Create another table named 'posts'
        this.db.run('CREATE TABLE IF NOT EXISTS audit (FOREIGN KEY(user_id) REFERENCES users(id), title TEXT, content TEXT, user_id INTEGER)');
    }

    closeDB() {
        // Close the database connection
        this.db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Database connection closed.');
        });

    }
}
export default DAO;