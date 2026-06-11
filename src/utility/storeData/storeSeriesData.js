const mongoose = require("mongoose");
const filterSeriesData = require("../filterData/filterSeriesData");
var cron = require('node-cron');
const { matchToday } = require("./storeMatchData");
const dayjs = require("dayjs");
const fetchSeriesData = require("../fetchData/fetchSeriesData");

const apiDataSchema = new mongoose.Schema(
  {
    id: Number,
  },
  { strict: false }
);
function getModel(collectionName) {
  return mongoose.models[collectionName] || mongoose.model(collectionName, apiDataSchema, collectionName);
}


async function currentSeries() {
  const activity = "Store Current Series Data |";
  const collectionName = "current_series";

  try {
    const Model = getModel(collectionName);

    const series = await filterSeriesData.currentSeries();

    // console.log("Fetched series data:", series);

    if (series.error) {
      console.error(`${activity} Error while filtering current series data`);
      return;
    }

    if (!series || series?.length === 0) {
      console.warn(`${activity} No series to store`);
      const collectionExists = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .hasNext();
      if (!collectionExists) {
        await mongoose.connection.createCollection(collectionName);
        console.log(`${activity} Created empty collection: ${collectionName}`);
      }
      return;
    }
    // const bulkOperations = series.map((item) => ({
    //   updateOne: {
    //     filter: { id: item.id }, // Find by unique identifier
    //     update: { $set: item }, // Update with new data
    //     upsert: true, // Insert if not exists
    //   },
    // }));
    const currentDate = dayjs().format("YYYY-MM-DD");
    await Model.deleteMany({ dateend: { $lt: currentDate } }); 
    console.log(`${activity} Deleted past series that have ended`);
    // console.log("series name" , sn)
      for (const match of series) {
      try {
        
        if (Array.isArray(match)) {
          
          for (const singleMatch of match) {
            // console.log("Processing match:", singleMatch);
            
            await Model.findOneAndUpdate(
              { cid: singleMatch.cid }, 
              { $set: singleMatch },
              { upsert: true } 
            );
            console.log(
              `${activity} Successfully processed id: ${singleMatch.cid}`
            );
          }
        } else {
          await Model.findOneAndUpdate(
            { cid: match.cid },
            { $set: match }, 
            { upsert: true } 
          );
          // console.log(
          //   `${activity} Successfully processed id: ${match.cid}`
          // );
        }
        
      } catch (updateError) {
        console.error(
          `${activity} Error updating/inserting id: ${match.cid || "undefined"}`,
          updateError
        );
      }
    }
    console.log(`${activity} Successfully stored/updated the data`);
  } catch (error) {
    console.error(
      `${activity} Error while storing series data: ${error.message}`
    );
    return { error };
  }
}
async function allSeries() {
  const activity = "Store Current Series Data |";
  const collectionName = "all_series";

  try {
    const Model = getModel(collectionName);

    const series = await fetchSeriesData.allSeries();

    if (series.error) {
      console.error(`${activity} Error while filtering current series data`);
      return;
    }

    if (!series || series?.length === 0) {
      console.warn(`${activity} No series to store`);
      const collectionExists = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .hasNext();
      if (!collectionExists) {
        await mongoose.connection.createCollection(collectionName);
        console.log(`${activity} Created empty collection: ${collectionName}`);
      }
      return;
    }

    for (const match of series) {
      try {
        if (Array.isArray(match)) {
         
          for (const singleMatch of match) {
            const existingSeries = await Model.findOne({ cid: singleMatch.cid });
            const seriesData = {
              ...singleMatch,
            };
           
            if (Object.prototype.hasOwnProperty.call(singleMatch, "isfeatured")) {
              seriesData.isfeatured = singleMatch.isfeatured;
             
            } else if (!existingSeries) {
              seriesData.isfeatured = false;
              
            }

            if ("logourl" in match && match.logourl) {
              seriesData.logourl = match.logourl;
            } else if (existingSeries && existingSeries.logourl) {
              seriesData.logourl = existingSeries.logourl; 
            } else {
              seriesData.logourl = ""; 
            }

            await Model.findOneAndUpdate(
              { cid: singleMatch.cid },
              { $set: seriesData },
              { upsert: true, new: true }
            );
            console.log(
              `${activity} Successfully processed id: ${singleMatch.cid}, isfeatured: ${seriesData.isfeatured}`
            );
          }
        } else {

          const existingSeries = await Model.findOne({ cid: match.cid });
          const seriesData = {
            ...match,
          };
          if (Object.prototype.hasOwnProperty.call(match, "isfeatured")) {
            seriesData.isfeatured = match.isfeatured;
          
          } else if (!existingSeries) {
            seriesData.isfeatured = false;
            
          }
          if (Object.prototype.hasOwnProperty.call(match, "logourl")) {
           
            seriesData.logourl = match.logourl || "";
          } else if (!existingSeries) {
           
            seriesData.logourl = ""
          }

          await Model.findOneAndUpdate(
            { cid: match.cid },
            { $set: seriesData },
            { upsert: true, new: true }
          );
          console.log(
            `${activity} Successfully processed id: ${match.cid}, isfeatured: ${seriesData.logourl}`
          );
        }
      } catch (updateError) {
        console.error(
          `${activity} Error updating/inserting id: ${match.cid || "undefined"}`,
          updateError
        );
      }
    }

    console.log(`${activity} Successfully stored/updated all series data`);
    return series;
  } catch (error) {
    console.error(
      `${activity} Error while storing series data: ${error.message}`
    );
    return { error };
  }
}
// cron.schedule("0 */2 * * *", async () => {
//   console.log("⏳ Running cron job...");
//   await currentSeries();
//   console.log("✅ Cron job completed.");
// });


cron.schedule('0 6 * * *' , async () => {
  console.log("⏳ Running cron job...");
  await allSeries();
  console.log("✅ Cron job completed.");
});
 
//  cron.schedule("* */23 * * * *", async () => {
//    console.log("⏳ Running cron job every 10 seconds...");
//    await currentSeries();
//    console.log("✅ Cron job completed.");
//  });





module.exports = { currentSeries  , allSeries};
