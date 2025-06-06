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
2. Run `npm run docker:dev:up`

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
2. Copy the `config.example.js` as `config.js` and config if needed
3. Run `npm run docker:prod:up`

## Configuring the WEEETofono

The WEEETofono is a daemon that can run on any machine that is always on and connected to the internet. It is used to send out notifications to people in the lab when someone needs to be let in. The code is in the `weeetofono` folder. To install:

1. Make sure you have `node.js` and `ffmpeg` installed, and make sure that the `ffplay` command is available in the terminal
2. Run `npm i` in the `weeetofono` folder
3. Copy the `config.example.js` as `config.js` and configure the settings and add the audio file to play, the api key can be generated in the web ui of the grillo
4. Run `npm start` to start the daemon
5. It is recommended to use a process manager like `pm2` to keep the daemon running, you can install it with `npm i -g pm2` and then run `pm2 start index.js --name weeetofono` and then `pm2 save` to make sure it starts on boot and `pm2 startup` to make sure it starts on boot

For more options look into the `package.json` file

## Credits

- Backtround photo by [Random Thinking](https://unsplash.com/@randomthinking?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/photos/a-close-up-of-a-computer-mother-board-iWLZV7cXHRE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
