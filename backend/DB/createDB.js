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
            await db.insertData(); // Insert data once tables are created
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