const express = require('express');
const Triggercontroller = require('../controllers/trigger');
const router = express.Router()


router.post('/refershseriesmatch/:id' , Triggercontroller.refreshSeriesMatch )
router.get('/refershallseries' , Triggercontroller.refreshAllSeriesMatch)


module.exports = router   