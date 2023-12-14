import config from './config.js';
import express from 'express';
import { db } from './index.js';
import dayjs from 'dayjs';
import cors from  'cors';
import bodyParser from 'body-parser';


const router = express.Router();

const corsOptions = {
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true
}
router.use(cors(corsOptions)); 
router.use(bodyParser.json());
router.use(express.json());




router.get('/ping', (req, res) => {
    res.send('pong');
});

router.get('/users/me', async (req, res) => {
    try{
        const user = await db.getUser(req.user.id);
        res.json(user);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

// #region bookings

/*
    Create a booking
*/

//not working atm
router.post('/bookings', async (req, res) => {
    try{

        const time = dayjs(req.body.time);
        console.log(req.body)
        if(!time.isValid() || time.isBefore(dayjs()) || time.isSame(dayjs())){
            res.status(400).json({error: "Invalid time"});
            return;
        }

        await db.addBooking(req.user.id, time);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Get all bookings
*/
router.get('/bookings', async (req, res) => {
    try{
        const bookings = await db.getBookings(req.params.userId);
        res.json(bookings);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Delete a booking
*/ 
router.delete('/bookings', async (req, res) => {
    try{
        const time = dayjs(req.body.time);
        await db.deleteBooking(req.user.id, time);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

// #endregion

// #region audits

/*
    Create an audit
*/
router.post('/audits', async (req, res) => {
    try{
        if(req.body.motivation.length > 100){
            res.status(400).json({error: "Invalid motivation"});
            return;
        }

        if(req.body.in === true){
            await db.addEntrance(req.user.id, dayjs());
            res.sendStatus(200);
            return;
        }

        if(req.body.in === false){
            await db.addExit(req.user.id, dayjs(), req.body.motivation);
            res.sendStatus(200);
            return;
        } 

        res.status(400).json({error: "Invalid 'in' flag"});

    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Get all audits
*/
router.get('/audits', async (req, res) => {
    try{
        const time = dayjs(req.body.time);
        await db.deleteBooking(req.user.id, time);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Delete an audit
*/
router.delete('/audit', async (req, res) => {
    try{
        const time = dayjs(req.body.time);
        if(!time.isValid()){
            res.status(400).json({error: "Invalid time"});
            return;
        }

        await db.deleteAudit(req.user.id, time);
        res.sendStatus(200);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

// #endregion

export default router;