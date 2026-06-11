const matchToday = require('../storeData/storeMatchData')
const { currentSeries } = require("../storeData/storeSeriesData");
const storeHomepageData = require('../storeData/storeHomepageData');
var cron = require('node-cron');

cron.schedule("*/10 * * * * *", async () => {
    console.log("⏳ Running cron job...");
    // await matchToday();
    console.log("✅ Cron job completed.");
  });

cron.schedule("*/1 * * * *", async () => {
    console.log("⏳ Running currentSeries cron job...");
    await currentSeries();
    console.log("✅ currentSeries Cron job completed.");
}); 

cron.schedule('* */3 * * *', async() => {
  console.log("⏳ Running storeCricRankingData cron job...")
  await storeHomepageData.storeCricRanking();
  console.log("✅ storeCricRankingData Cron job completed.")
});

cron.schedule('* */3 * * *', async() => {
  console.log("⏳ Running storePointsTable cron job...")
  await storeHomepageData.storePointsTable();
  console.log("✅ storePointsTable Cron job completed.")
});