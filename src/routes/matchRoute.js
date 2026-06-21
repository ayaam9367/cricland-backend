const express = require('express');
const Matchcontroller = require('../controllers/matches.controller');

const router = express.Router()


router.get('/' , Matchcontroller.todayMatch)
router.put('/currentseries/:id' , Matchcontroller.UpdateCurrentSeriesMatch)
router.put('/allseries/:id' , Matchcontroller.UpdateSeries)
router.get('/allseries' , Matchcontroller.getAllSeries)
router.get('/currentseries' ,Matchcontroller.Currentseries)
router.get('/currentseries/:cid' , Matchcontroller.SeriesAllMatch)
router.get('/:matchId' , Matchcontroller.handleWebsocketreq)

module.exports = router 