const express = require('express');
const controllers = require('../controllers/index');

const router = express.Router();
router.get('/cric-ranking', controllers.homepageController.cricRankingHomepage);
router.get('/points-table/:cid', controllers.homepageController.pointsTableByCompId);
router.get('/points-table', controllers.homepageController.pointsTable);

module.exports = router;