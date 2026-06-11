const {socketHandler} = require('./socketHandler');
const {server} = require('./server')
const connectDatabase = require('./config/database');
const { matchIds } = require('./utility/constants/constants');
require('./utility/storeData/storeSeriesData');
if(process.env.NODE_ENV){
    require('dotenv').config({
        path : `.env.${process.env.NODE_ENV}`
    })
} else{
    require('dotenv').config();
} 
require("./expressServer")
connectDatabase();
socketHandler(server);

    


