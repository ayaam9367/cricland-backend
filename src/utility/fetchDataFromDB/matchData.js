const axios = require("axios");
const mongoose = require("mongoose");
const dayjs = require("dayjs");

const apiDataSchema = new mongoose.Schema(
  {
    id: Number,
  },
  { strict: false }
);

function getModel(collectionName) {
  return mongoose.model(collectionName, apiDataSchema, collectionName);
}

/**
 * define the model you want to fetch the data from
 * get the curr_time
 * find matches where curr_time >= timestamp_start && curr_time <= timestamp_end
 * sort them based on timestamp_start
 */

async function liveMatches() {
  const activity = "Fetch Live Match |";
  const collectionName = "match_today";
  try {
    const todaymatch1 = getModel(collectionName);
  const todayMatch = await todaymatch1.find();

  const liveMatches = [];
  const scheduledMatches = [];
  const completedMatches = [];
    const currentTimestamp = Date.now(); // Current time in milliseconds
  // console.log("Current Timestamp:", currentTimestamp);
  // console.log("Current Time (IST):", new Date(currentTimestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  todayMatch[0].result.forEach(match => {
    const matchStartTime = match.timestamp_start * 1000; // Convert to milliseconds
    const matchEndTime = match.timestamp_end * 1000; // Convert to milliseconds

    // console.log(`Match ${match.match_id}: Start=${new Date(matchStartTime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}, End=${new Date(matchEndTime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}`);

    // Determine the match status based on the current timestamp
    if (currentTimestamp >= matchStartTime && currentTimestamp <= matchEndTime) {
      // Match is live
      // console.log(todayMatch)
      if (match.status_str !== "Completed") {
        liveMatches.push(match);
        CurrentlyLiveMatch.push(String(match.match_id));
      } else {
        completedMatches.push(match);
      }
      // console.log(`Match ${match.match_id} is LIVE.`);
    } else if (currentTimestamp < matchStartTime) {
      // Match is scheduled (upcoming)
      scheduledMatches.push(match);
      // console.log(`Match ${match.match_id} is SCHEDULED.`);
    } else if (currentTimestamp > matchEndTime) {
      // Match is completed
      completedMatches.push(match);
      // console.log(`Match ${match.match_id} is COMPLETED.`);
    }
  });
    return {liveMatches , completedMatches , scheduledMatches};
  } catch (error) {
    console.error(`${activity} Error while fetching live matches: ${error.message}`);
    return {error}; //see if its a good idea to return the error object or not. 
  }
}

/**
 * define the model you want to fetch the data from
 * get the curr_time
 * find matches where curr_time < timestamp_start
 * sort them based on timestamp_start
 */
// async function upcomingMatches(){
//     const activity = 'Fetch Upcoming Matches |';
//     const collectionName = 'match_today';
//     try {
//         const Model = getModel(collectionName);
//         const curr_time = dayjs().unix();
//         console.log(`${activity} Logging current time: ${curr_time}`);
//         const result = await Model.find({
//             timestamp_start : {$gt : curr_time}
//         });
//         //see if optional chaining is actually necessary here or not
//         if(result?.length === 0){
//             console.log(`${activity} No upcoming matches`);
//             return [];
//         }
//         result.sort((a,b) => a.timestamp_start - b.timestamp_start);
//         return result;
//     } catch (error) {
//         console.error(`${activity} Error while fetching upcoming matches: ${error.message}`);
//         return {error} //see if its a good idea to return an error object here
//     }
// }

module.exports = {liveMatches};