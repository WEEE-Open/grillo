import config from './config.js';

import express from 'express';
import yargs from 'yargs';

const argv = yargs(process.argv)
  .option('prod', {
    alias: 'p',
    description: 'Run in production mode',
    type: 'boolean'
  })
  .help()
  .alias('help', 'h').argv;

import api from './api.js';
import { Database } from './DB/db.js';

export const db = new Database('./DB/grillo.db');

let app = express();
app.use(express.json());

app.use('/api/v1/', api);

if (argv.prod) {
    app.use('/', express.static('../frontend/dist'));
	app.use((req, res) => {
		res.sendFile('../frontend/dist/index.html');
	});
}
// ! do NOT put anything after this otherwise they will be bypassed in prod
app.listen(config.port, () => {
    console.log(`Server started on port ${config.port}`);
});