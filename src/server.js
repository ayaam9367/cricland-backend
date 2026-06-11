const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("http");
const mongoose = require('mongoose');
const { matchToday } = require("./utility/fetchData/fetchMatchData");


const app = express();
const upload = multer(); 

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if(process.env.NODE_ENV){
  require('dotenv').config({
      path : `.env.${process.env.NODE_ENV}`
  })
} else{
  require('dotenv').config();
}
const PORT = process.env.NODE_PORT || 3301;
const server = http.createServer(app).listen(PORT, (err) => {
  if (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
  console.log(`🚀 Server is listening at : http://localhost:${PORT}`);
});   


module.exports = { app, server };