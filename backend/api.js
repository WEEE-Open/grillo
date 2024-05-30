import config from './config.js';
import express, { query } from 'express';
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




router.get('/ping', async (req, res) => {
	let now = dayjs();
	await db.addUserIfNotExists('UID1');
	await db.addBooking('UID1', now.unix(), now.unix() + 3600);
    res.send('pong');
});

router.get('/user', async (req, res) => {
    try{
        const user = await db.getUser(req.user.id);
        res.json(user);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});

router.delete('/user/session');
router.get('/user/session');

router.get('/lab/info');
// audit
router.post('/lab/in');
router.post('/lab/out'); 
router.post('/lab/ring');

router.get('/bookings');
// week, year

// router.post('/bookings/new'); done

router.post('/bookings/:id');   //to edit a booking
router.delete('/bookings/:id');

router.get('/audits');

router.get('/stats');

router.get('/notifications/new');
router.post('/notification/:id');   //to edit a notification
router.delete('/notification/:id');

router.post('/notification/:id/read');
router.post('/notification/:id/delivered');

router.get('/tokens');
router.post('/tokens/new');
router.delete('/bookings/:id');

router.get('/events');
router.post('/events/new');
router.post('/events/:id');
router.delete('/events/:id');

// #region bookings

/*
    Create a booking
*/
router.post('/bookings/new', async (req, res) => {
    try{
        var inTime = parseInt(req.body.startTime);
        var endTime = parseInt(req.body.endTime);

        if(inTime == NaN || dayjs.unix(inTime).isAfter(dayjs())){
            res.status(400).json({error: "Invalid time"});
            return;
        }
        await db.addBooking(req.body.user, inTime, endTime);
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
        let week = parseInt(req.query.week);
        let year = parseInt(req.query.year);
        let users = req.query.user.split(",");
        if (week == NaN){
            res.status(400).json({error: "Invalid time"});
            return;
        }
        let startWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek');
        let endWeek = dayjs().year(year).isoWeek(week).endOf('isoWeek');

        const bookings = await db.getBookings(startWeek, endWeek, users);
        res.json(bookings);
    }
    catch (error){
        console.error(error);
        res.status(503).json(error);
    }
});


// /*
//     Delete a booking
// */ 
// router.delete('/del_booking', async (req, res) => {
//     try{
//         const time = dayjs(req.body.time);
//         await db.deleteBooking(req.user.id, time);
//         res.sendStatus(200);
//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });

// // #endregion

// // #region audits

// /*
//     Create an audit
//     have to be tested
// */
// router.post('/add_audit', async (req, res) => {
//     try{      
//         if(req.body.motivation != null && req.body.motivation.length > 100){
//             res.status(400).json({error: "Invalid motivation"});
//             return;
//         }
//         if(req.body.in === true){
//             await db.addEntrance(req.user.id, dayjs());
//             res.sendStatus(200);
//             return;
//         }

//         if(req.body.in === false){
//             await db.addExit(req.user.id, dayjs(), req.body.motivation);
//             res.sendStatus(200);
//             return;
//         } 

//         res.status(400).json({error: "Invalid 'in' flag"});

//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });

// /*
//     Get all audits
// */

// router.get('/get_audits', async (req, res) => {
//     try{
//         const param = req.query;
//         let startTime = null;
//         let endTime = null;
//         let user = null    
//         if ('fromDate' in param) {
//             startTime = param['fromDate'];
//         }
//         if ('toDate' in param) {
//             endTime = param['toDate'];
//         }
//         if ('user' in param){
//             user = param['user']
//         }
//         let results = await db.getAudit(startTime, endTime, user);
//         res.sendStatus(200);
//         console.log(results);
//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });

// /*
//     Edit audit ADMINS ONLY
// */
// router.post('/edit_audit', async (req, res) => {
//     try{
//         let userId = 'UID1';
//         let time = '2023-11-21T16:30:08+00:00';
//         let newTime = '2023-11-21T16:00:08+00:00'
//         let newMotivation = 'qualcosa';
//         let results = await db.editAudit(userId, time, newTime, newMotivation);
//         res.sendStatus(200);
//         console.log(results);
//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });


// /*
//     Get stat

//     The timeframe can be selected but the filter can be one only by a single user
// */
// router.get('/get_stats', async (req, res) => {
//     try{
//         const param = req.query;
//         let startTime = null;
//         let endTime = null;
//         let user = null    
//         if ('fromDate' in param) {
//             startTime = param['fromDate'];
//         }
//         if ('toDate' in param) {
//             endTime = param['toDate'];
//         }
//         if ('user' in param){
//             user = param['user']
//         }
//         let results = await db.getStats(startTime, endTime, user);
//         res.sendStatus(200);
//         console.log(results);
//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });

// /*
//     Delete an audit
//     ADMIN ONLY?
// */
// router.delete('/del_audit', async (req, res) => {
//     try{
//         const time = dayjs(req.body.time);
//         if(!time.isValid()){
//             res.status(400).json({error: "Invalid time"});
//             return;
//         }

//         await db.deleteAudit(req.user.id, time);
//         res.sendStatus(200);
//     }
//     catch (error){
//         console.error(error);
//         res.status(503).json(error);
//     }
// });

// #endregion

export default router;