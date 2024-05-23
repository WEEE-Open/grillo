# grillo


## Running Development Mode

Development mode runs the backend with nodemon, so that as soon as you save it relaunches, and also starts up the vite development server and proxies trough the API.

### Bare Metal
1. Clone the repo
2. Run `npm i`
3. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
4. Setup a postgres database and configure the cedentials in the `config.js` file
5. In the root folder run `npm run dev`
6. Open the site on `localhost:5173`

### Docker
1. Clone the repo
2. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
3. Create a `.env` file and enter `DEVELOPMENT=true`
4. Create an empty folder in the root path called `database`
5. Create folder in root path called `database`
6. Run `docker-compose up`

### Create DB and adding junk data

Run `npm run createDB` to create db
Run `npm run addJunkData` to create DB and populate with junk data

If you are using docker, set `ADDJUNKDATA=true` [temporarily not working, use one of the methods above]



# Running Production Mode

Production mode will automatically compile the frontend, and start up the backend server while statically hosting the frontend built files.

### Bare Metal
1. Clone the repo
2. Run `npm i`
3. Copy the `config.example.js` as `config.js` and config if needed (if you edit the server port make sure to also change it in the `frontend/vite.config.js` file)
4. [Create database](#create-db-and-adding-junk-data)
5. In the root folder run `npm run prod`
6. Open the site on `localhost:3000`

### Docker
1. Clone the repo
2. [Create database](#create-db-and-adding-junk-data)
3. Run `docker-compose up`


For more options look into the `package.json` file


## Stuff
WEEElab telegram bot evolution
![immagine](https://github.com/WEEE-Open/grillo/assets/43443041/351b0317-4092-401f-a56f-2fe6c3902659)
