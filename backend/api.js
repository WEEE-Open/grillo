import config from './config.js';

import express from 'express';
import DAO from './DAO.js';

let router = express.Router();
router.use(express.json());

router.get('/ping', (req, res) => {
    res.send('pong');
});


export default router;