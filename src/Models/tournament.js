const mongoose = require("mongoose");
const tournamentSchema = new mongoose.Schema({
    name: {
      type: String,
    },
    cid: {
      type: Number,
    },
    isfeatured:{
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "result", "Cancelled"],
    },
    matchs: [
      {
        matchId: {
          type: String,
        },
        matchTeama: {
          name: {
            type: String,
          },
          shortname:{
            type:String,
          },
          logo: {
            type: String,
          },
        },
        matchStatus: {
          type: String,
          enum: ["Scheduled", "Live", "Completed", "Cancelled"],
        },
        matchTeamb: {
          name: {
            type: String,
          },
          shortname:{
            type:String,
          },
          logo: {
            type: String,
          },
        },
        matchStartDate: {
          type: Date,
        },
        time: {
          type: String,
        },
        matchVenue: {
          type: String,
        },
        urls: {
          type: Map,
          of: [String],
          default: {}, 
        },
        displayUrls: {
          type: [String],
          default: [],
        },
      },
    ],
  });
  
  module.exports = mongoose.model("Tournamenttl", tournamentSchema);
  