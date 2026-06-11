const mongoose = require("mongoose");
//shift this logic to services
async function cricRankingData() {
  const activity = "Fetch CricRanking Data from DB |";
  const collectionName = "cric_ranking";
  try {
    /**
     * This checks the mongodb database whether the collectiion exists but here 
     *  we need to check the internal registery of mongoose to see if the collection with this 
     * name has been defined already, hence we don't use the method
     */
    // const collectionExists = await mongoose.connection.db
    //   .listCollections({ name: 'cric_rankings' }).hasNext()

    let cricRankingModel;
    if (mongoose.models[collectionName]) {
      cricRankingModel = mongoose.model(collectionName);
    } else {
      // await mongoose.connection.createCollection(collectionName);
      const cricRankingSchema = new mongoose.Schema({}, { strict: false });
      cricRankingModel = mongoose.model(collectionName, cricRankingSchema);
      console.log(`${activity} Created a collection: ${collectionName}`);
    }
    const rankings = await cricRankingModel.findOne().sort({ _id: -1 });
    return rankings;
  } catch (error) {
    console.log(`${activity} ${error}`);
  }
}


module.exports = { cricRankingData };
