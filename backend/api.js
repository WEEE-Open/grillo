import config from './config.js';
import express from 'express';
import { db } from './index.js';

let router = express.Router();
router.use(express.json());

router.get('/ping', (req, res) => {
    res.send('pongo');
});


// test booking API
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

router.get('/nobook', async (req, res) => {
    try{
        const booking = await db.deleteBooking('test', 123);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

// test audit API
router.get('/auditIn', async (req, res) => {
    try{
        const audit = await db.addEntrance('UID1', '2023-12-02T09:54:08+00:00', true, '');
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

router.get('/auditOut', async (req, res) => {
    try{
        const audit = await db.addExit('UID1', '2023-12-02T12:54:08+00:00', false, 'boh');
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});


router.get('/auditDel', async (req, res) => {
    try{
        const audit = await db.deleteAudit('UID1', '2023-12-02T12:54:08+00:00');
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