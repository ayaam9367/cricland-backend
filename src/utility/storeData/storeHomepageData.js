const mongoose = require("mongoose");
const { fetchCricRanking } = require("../fetchData/fetchHomepageData");
const { filterPointsTable } = require("../filterData/filterHomepageData");
const matchService = require("../../services/matchService");
const { response } = require("express");
var cron = require("node-cron");

async function storeCricRanking() {
  const activity = "Store Cric-Ranking Data |";
  const collectionName = "cric_ranking";
  try {
    const dataToStore = await fetchCricRanking(); //we are not doing any filtering of this data
    let cricRankingModel;
    if(mongoose.models[collectionName]){
      cricRankingModel = mongoose.model(collectionName);
    } else {
      const cricRankingSchema = new mongoose.Schema(
        {},
        {
          strict: false,
          timestamps: true
        }
      );
      cricRankingModel = mongoose.model(collectionName, cricRankingSchema);
    }
    
    await cricRankingModel.findOneAndReplace({}, dataToStore, {
      upsert: true,
      new: true,
    });
    console.log(`${activity} Updated Cric-Rankings Successfully`);
  } catch (error) {
    console.log(`${activity} ${error.message}`);
  }
}

async function storePointsTable(competition_id) {
  const activity = "Store Points Table Data |";
  let collectionName = "points_table";
  try {
    competition_id = parseInt(competition_id, 10);
    const response = await filterPointsTable(competition_id);
    if (!response.status) {
      return {
        status: false,
        message: response.message,
      };
    }
    const pointsTable = response.data;
    const comp_id = pointsTable.cid;
    let pointsTableModel;
    if (mongoose.models[collectionName]) {
      pointsTableModel = mongoose.model(collectionName);
    } else {
      const pointsTableSchema = new mongoose.Schema(
        {},
        { strict: false, timestamps: true }
      );
      pointsTableModel = mongoose.model(collectionName, pointsTableSchema);
    }
    const responseTable = await pointsTableModel.findOneAndUpdate(
      { cid: comp_id },
      { $set: pointsTable, updatedAt : new Date() },
      { upsert: true, new: true }
    );
    console.log(`${activity} Points table updated/created for cid: ${comp_id}`);

    return {
      status: true,
      message: `stored points table for comp_id: ${comp_id}`,
      data: responseTable,
    };
  } catch (error) {
    console.log(`${activity} ${error.message}`);
  }
}

async function storeAllPointsTables() {
  const activity = "Store All Points Tables |";
  try {
    let {
      status: seriesStatus = false,
      code: seriesStatusCode = 500,
      data: seriesData = [],
      message:
        seriesMessage = "Error occured while fetching current live series",
    } = await matchService.Currentliveseries(activity);

    if (!seriesStatus) {
      console.log(
        `${activity} Error occured while fetching current live series ${error.message}`
      );
      return res.status(seriesStatusCode).send({
        status: seriesStatus,
        message: seriesMessage,
      });
    }
    seriesData.forEach(async (series) => {
      await storePointsTable(series.cid);
    });
  } catch (error) {
    console.log(
      `${activity} Error occured while storing all points tables `,
      error
    );
  }
}

cron.schedule("0 */3 * * *", async () => {
  console.log("⏳ Running storeCricRankingData cron job...");
  await storeCricRanking();
  console.log("✅ storeCricRankingData Cron job completed.");
});

cron.schedule("0 */3 * * *", async () => {
  console.log("⏳ Running storePointsTable cron job...");
  await storeAllPointsTables();
  console.log("✅ storePointsTable Cron job completed.");
});

cron.schedule("15 23 * * *", async () => {
  console.log("⏳ Running storePointsTable cron job at 11:15 PM...");
  await storeAllPointsTables();
  console.log("✅ storePointsTable Cron job completed.");
});


module.exports = { storeCricRanking, storePointsTable, storeAllPointsTables };
