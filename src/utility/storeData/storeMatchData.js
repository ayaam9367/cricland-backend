const axios = require("axios");
const mongoose = require("mongoose");
const filterMatchData = require("../filterData/filterMatchData");
const Tournamenttl = require("../../Models/tournament");
const GetFetchData = require('../fetchData/fetchMatchData')
var cron = require('node-cron');
const { currentSeries } = require("./storeSeriesData");

const apiDataSchema = new mongoose.Schema(
  {
    id: Number,
  },
  { strict: false }
)

function getModel(collectionName) {
  return mongoose.models[collectionName] || mongoose.model(collectionName, apiDataSchema, collectionName);
}


async function getAllMatches(cid) {
  try {
    const matches = await GetFetchData.GetallMatches(cid);
    if (!matches || matches.length === 0) {
      console.warn(`No matches found for competition ID: ${cid}`);
      return [];
    }
 console.log(matches)
    let tournament = await Tournamenttl.findOne({ cid });

    if (!tournament) {
      tournament = new Tournamenttl({
        cid,
        name: matches[0].competition.title,
        status: matches[0].competition.status,
        isfeatured:false,
        matchs: [],
      });
    }

    for (const match of matches) {
      // console.log(match)
      const dateStr = match.date_start_ist.includes("+05:30")
    ? match.date_start_ist
    : `${match.date_start_ist}+05:30`; 

  
  const matchStartDate = new Date(dateStr);
      const matchData = {
        matchId: match.match_id.toString(),
        matchTeama: {
          name: match.teama.name,
          shortname:match.teama.short_name,
          logo: match.teama.logo_url,
        },
        matchTeamb: {
          name: match.teamb.name,
          shortname:match.teamb.short_name,
          logo: match.teamb.logo_url,
        },
        matchStatus: match.status_str,
        matchStartDate: matchStartDate.toISOString(), 
    time: matchStartDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // Format time in IST
    }),
        matchVenue: `${match.venue.name}, ${match.venue.location}, ${match.venue.country}`,
        urls: {}, 
      };
// console.log(matchData)
      const existingMatchIndex = tournament.matchs.findIndex(
        (m) => m.matchId === matchData.matchId
      );

      if (existingMatchIndex >= 0) {
  
        tournament.matchs[existingMatchIndex] = {
          ...tournament.matchs[existingMatchIndex].toObject(), 
          matchStatus: matchData.matchStatus, 
          matchStartDate: matchData.matchStartDate,
          time: matchData.time, 
        };
      } else {
        tournament.matchs.push(matchData);
      }
    }

    await tournament.save();
    return tournament.matchs;
  } catch (error) {
    console.error(`Error while fetching/upserting matches: ${error}`);
    throw new Error(`Error while fetching all matches: ${error}`);
  }
}



async function getMatchInfo() {
  try {
    const pLimit = (await import("p-limit")).default;
    const limit = pLimit(30);
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    const matchModel = getModel("all_matches");
    const matches = await matchModel.find({}).select("match_id -_id");

    // console.log(matches);

    const limitedRequests = matches.map((match) =>
      limit(async () => {
        const matchId = match.match_id;
        const url = `https://rest.entitysport.com/v2/matches/${matchId}/info?token=${ACCESS_TOKEN}`;
        const response = await axios.get(url);
        return response.data.response;
      })
    );

    // Execute all requests with rate limiting
    const results = await Promise.allSettled(limitedRequests);

    //const results = await Promise.allSettled(limitedReqests);

    const successfulDetails = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const failedDetails = results.filter(
      (result) => result.status === "rejected"
    );
    if (failedDetails.length > 0) {
      console.log(failedDetails);
      console.warn(
        `Some requests failed : ${failedDetails.length} errors reported`
      );
    }

    //console.log(failedDetails);

    res.status(200).json(successfulDetails);

    const collectionName = "match_info";
    const Model = getModel(collectionName);
    for (const detail of successfulDetails) {
      const newData = Model(detail);
      await newData.save();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error while fetching match info : ${error}`);
  }
}

/**
 * get the filtered data for match today
 * if there is no match today data then create an empty collection (so that .find() on that collection doesn't return an error
 * otherwise insert all the matches in the collection using insertMany()
 * @returns
 */

async function matchToday() {
  const activity = "Store Match Today Data |";
  const collectionName = "match_today";

  try {
    const Model = getModel(collectionName);

    
    const matches = await filterMatchData.matchToday();
    

    
    if (matches.error) {
      console.error(`${activity} Error while filtering match data`);
      return;
    }

    
    if (!matches || !matches.result || matches.result.length === 0) {
      console.warn(`${activity} No matches to store`);

      
      const collectionExists = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .hasNext();
      if (!collectionExists) {
        await mongoose.connection.createCollection(collectionName);
        console.log(`${activity} Created empty collection: ${collectionName}`);
      }

      return; 
    }

    
    for (const match of matches.result) {
      try {

        await Model.findOneAndUpdate(
          { match_id: match.match_id }, 
          { $set: match }, 
          { upsert: true } 
        );
        // console.log(
        //   `${activity} Successfully processed match with id: ${match.match_id}`
        // );
      } catch (updateError) {
        console.error(
          `${activity} Error updating/inserting match with id: ${match.match_id}`,
          updateError
        );
      }
    }

    console.log(`${activity} Successfully updated/inserted all matches.`);
  } catch (error) {
    console.error(`${activity} Error while storing match today data: ${error}`);
    return error;
  }
}


// cron.schedule("* * * * * *", async () => {
//   console.log("⏳ Running cron job...");
//   await currentSeries();
//   console.log("✅ Cron job completed.");
// });

cron.schedule("0 */2 * * *", async () => {
  console.log("⏳ Running cron job...");
  await matchToday();
  console.log("✅ Cron job completed.");
});







module.exports = { matchToday , getModel , getAllMatches };
