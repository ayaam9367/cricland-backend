const express = require('express');
const UserController = require("../controllers/userController")
const router = express.Router()


router.route('/').get(UserController.getallusers).post( UserController.createuser).delete(UserController.deleteuser)


module.exports = router