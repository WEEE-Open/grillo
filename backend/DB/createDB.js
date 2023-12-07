import { Database } from "./db.js";
import yargs from 'yargs';

const argv = yargs(process.argv)
  .option('addJunkData', {
    alias: 'j',
    description: 'Adding junk data to database after creation',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h').argv;

// Function to populate the database
const createDatabase = async () => {
    try {
        const db = new Database('grillo.db');
        await db.createTables();
        console.log("Tables created");

        if(argv.addJunkData){
            await db.emptyTables(); // Cleans the tables
            console.log("Cleaned tables");
            await insertData(db.db); // Insert data once tables are created
            console.log("Entries inserted");
        }

        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Database populated successfully!');
            }
        });


    } catch (error) {
        console.error('Error populating database:', error);
    }
};

createDatabase();

async function insertData(db){
    return new Promise((resolve, reject) => {
        db.serialize(() => {

            //users

            db.run("INSERT INTO user (id, seconds, inlab, lastUpdate, lastSeconds, hasKey) VALUES ('UID1', 0, false, '2023-11-21T09:54:08+00:00', 0, true)"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO user (id, seconds, inlab, lastUpdate, lastSeconds, hasKey) VALUES ('UID2', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO user (id, seconds, inlab, lastUpdate, lastSeconds, hasKey) VALUES ('UID3', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO user (id, seconds, inlab, lastUpdate, lastSeconds, hasKey) VALUES ('UID4', 0, false, '2023-11-21T09:54:08+00:00', 0, false)"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });

            //audits

            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID2', '2023-11-21T09:54:08+00:00', true, '')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID3', '2023-11-21T09:54:08+00:00', true, '')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID1', '2023-11-21T09:54:08+00:00', true, '')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID4', '2023-11-21T09:54:08+00:00', true, '')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID2', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID3', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID4', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            db.run("INSERT INTO audit (user_id, time, enter, motivation) VALUES ('UID1', '2023-11-21T11:54:08+00:00', false, 'nessuna')"
                , (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });

            //bookings

            db.run("INSERT INTO booking (user_id, time) VALUES ('UID2', '2023-11-21T09:54:08+00:00')"
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