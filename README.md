# Grillo

The future of lab booking in one easy to use web app.


## Running Development Mode

Development mode runs the backend with nodemon, so that as soon as you save it relaunches, and also starts up the vite development server and proxies trough the API.

### Bare Metal
1. Clone the repo
2. Run `npm i`
3. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
4. Setup a postgres database, load the schema found in `docker/db/createTables.sql` and configure the cedentials in the `config.js` file
5. In the root folder run `npm run dev`
6. Open the site on `localhost:5173`

### Docker
1. Clone the repo
2. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
3. Create a `.env` file and enter `DEVELOPMENT=true` and optionally `ADDJUNKDATA=true` to add some demo data to the database as well
4. Create an empty folder in the root path called `database`
5. Run `docker-compose up`

# Running Production Mode

Production mode will automatically compile the frontend, and start up the backend server while statically hosting the frontend built files.

### Bare Metal
1. Clone the repo
2. Run `npm i`
3. Copy the `config.example.js` as `config.js` and config if needed
4. Setup a postgres database, load the schema found in `docker/db/createTables.sql` and configure the cedentials in the `config.js` file
5. In the root folder run `npm run prod`
6. Open the site on `localhost:3000`

### Docker
1. Clone the repo
2. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
3. Create a `.env` file and enter `DEVELOPMENT=false`
4. Create an empty folder in the root path called `database`
5. Run `docker-compose up`


For more options look into the `package.json` file

