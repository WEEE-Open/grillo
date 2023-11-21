import config from './config.js';
import express from 'express';
import { db } from './index.js';

let router = express.Router();
router.use(express.json());

router.get('/ping', (req, res) => {
    res.send('pongo');
});

router.get('/book', async (req, res) => {
    try{
        const booking = await db.addBooking('test', 123);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

router.get('/users/me', async (req, res) => {
    try{
        const user = await db.getUser('UID1');
        res.json(user);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

export default router;