import config from './config.js';
import express from 'express';
import {addBooking} from './DAO.js' 

let router = express.Router();
router.use(express.json());

router.get('/ping', (req, res) => {
    res.send('pong');
});

router.get('/book', async (req, res) => {
    await addBooking('test', 123)
    .then(res.sendStatus(200))
    .catch(err => res.status(503).json({errors: err.array()}))
})

export default router;