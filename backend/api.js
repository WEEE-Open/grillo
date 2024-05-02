import config from './config.js';
import express from 'express';
import { db } from './index.js';
import dayjs from 'dayjs';
//import cors from  'cors';
import bodyParser from 'body-parser';


const router = express.Router();

const corsOptions = {
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true
}
//router.use(cors(corsOptions)); 
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

//how to pass values using a post not a get??
router.get('/add_booking', async (req, res) => {
    console.log(req.query.user);
    try{
        const time = req.query.time;
        var parts = time.split('T');
        var mydate = new Date(parts[0]);
        const today = dayjs().toISOString();
        if(mydate < today){
            res.status(400).json({error: "Invalid time"});
            return;
        }

        await db.addBooking(req.query.user , time);
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
router.get('/get_bookings', async (req, res) => {
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
router.delete('/del_booking', async (req, res) => {
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
    have to be tested
*/
router.post('/add_audit', async (req, res) => {
    try{      
        if(req.body.motivation != null && req.body.motivation.length > 100){
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

router.get('/get_audits', async (req, res) => {
    try{
        const param = req.query;
        let startTime = null;
        let endTime = null;
        let user = null    
        if ('fromDate' in param) {
            startTime = param['fromDate'];
        }
        if ('toDate' in param) {
            endTime = param['toDate'];
        }
        if ('user' in param){
            user = param['user']
        }
        let results = await db.getAudit(startTime, endTime, user);
        res.sendStatus(200);
        console.log(results);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Edit audit ADMINS ONLY
*/
router.post('/edit_audit', async (req, res) => {
    try{
        let userId = 'UID1';
        let time = '2023-11-21T16:30:08+00:00';
        let newTime = '2023-11-21T16:00:08+00:00'
        let newMotivation = 'qualcosa';
        let results = await db.editAudit(userId, time, newTime, newMotivation);
        res.sendStatus(200);
        console.log(results);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});


/*
    Get stat

    The timeframe can be selected but the filter can be one only by a single user
*/
router.get('/get_stats', async (req, res) => {
    try{
        const param = req.query;
        let startTime = null;
        let endTime = null;
        let user = null    
        if ('fromDate' in param) {
            startTime = param['fromDate'];
        }
        if ('toDate' in param) {
            endTime = param['toDate'];
        }
        if ('user' in param){
            user = param['user']
        }
        let results = await db.getStats(startTime, endTime, user);
        res.sendStatus(200);
        console.log(results);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

/*
    Delete an audit
    ADMIN ONLY?
*/
router.delete('/del_audit', async (req, res) => {
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