const fetchMatchDataFromDB = require("../fetchDataFromDB/matchData");
const socketHandler = require("../../socketHandler");
const server = require("../../server");
const { matchIds } = require("../constants/constants");
const { sub } = require("../../Redisclient");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const tz = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(tz);

async function liveMatch() {
  const activity = "Fetching Live Match |";
  try {
    const liveMatches = await fetchMatchDataFromDB.liveMatches();
    // console.log(liveMatches.liveMatches)
    //the if statement is incomplete right now
    if (!liveMatches.liveMatches || liveMatches.liveMatches?.length === 0) {
      console.log(`${activity} No Live Matches`);
    }
    const matchId = liveMatches.liveMatches[0];
    if (!matchId) {
      console.error(`${activity} No Match ID found`);
      return;
    }
  } catch (error) {
    console.error(
      `${activity} Error while fetching live match: ${error.message}`
    );
    return;
  }
}

// async function upcomingMatch() {
//   const activity = "Fetching Upcoming Match |";
//   try {
//     const upcomingMatch = await fetchMatchDataFromDB.upcomingMatch();

//     //this is if statement is incomplete
//     if (upcomingMatch?.length === 0) {
//       console.log(`${activity} No Upcoming Match`);
//     }
//     const matchId = upcomingMatch[0]?.matchId;
//     if (!matchId) {
//       console.error(`${activity} No Match ID found`);
//       return;
//     }
//     //don't know what to do after fetching the match id;
//   } catch (error) { }
// }

// async function CurrentlyLiveMatch(matchiId) {
//    const startDate = dayjs().format("YYYY-MM-DD")
//    const endDate = dayjs().format("YYYY-MM-DD")

//    const livematch = await 
// }

module.exports = { liveMatch};
