const mongoose = require("mongoose");

exports.cricRankingData = async (activity) => {
  const collectionName = "cric_ranking";

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
  // console.log(rankings);
  const ranks = rankings?.ranks || {};
  const womenRanks = rankings?.women_ranks || {};
  const ODI = {
    batsmen: ranks?.batsmen?.odis?.slice(0, 10) || [],
    bowlers: ranks?.bowlers?.odis?.slice(0, 6) || [],
    allRounders: ranks["all-rounders"].odis?.slice(0, 10) || [],
    teams: ranks?.teams?.odis?.slice(0, 10) || [],
  };
  const Tests = {
    batsmen: ranks?.batsmen?.tests?.slice(0, 10) || [],
    bowlers: ranks?.bowlers?.tests?.slice(0, 10) || [],
    allRounders: ranks["all-rounders"].tests?.slice(0, 10) || [],
    teams: ranks?.teams?.tests?.slice(0, 10) || [],
  };

  const T20 = {
    batsmen: ranks?.batsmen?.t20s?.slice(0, 10) || [],
    bowlers: ranks?.bowlers?.t20s?.slice(0, 10) || [],
    allRounders: ranks["all-rounders"].t20s?.slice(0.10) || [],
    teams: ranks?.teams?.t20s?.slice(0, 10) || [],
  };

  const ODIWomen = {
    batsmen: womenRanks?.batsmen?.odis?.slice(0, 10) || [],
    bowlers: womenRanks?.bowlers?.odis?.slice(0, 10) || [],
    allRounders: womenRanks["all-rounders"].odis?.slice(0, 10) || [],
    teams: womenRanks?.teams?.odis?.slice(0, 10) || [],
  };
  const TestsWomen = {
    batsmen: womenRanks?.batsmen?.tests?.slice(0, 10) || [],
    bowlers: womenRanks?.bowlers?.tests?.slice(0, 10) || [],
    allRounders: womenRanks["all-rounders"].tests?.slice(0, 10) || [],
    teams: womenRanks?.teams?.tests?.slice(0, 10) || [],
  };

  const T20Women = {
    batsmen: womenRanks?.batsmen?.t20s?.slice(0, 10) || [],
    bowlers: womenRanks?.bowlers?.t20s?.slice(0, 10) || [],
    allRounders: womenRanks["all-rounders"].t20s?.slice(0.10) || [],
    teams: womenRanks?.teams?.t20s?.slice(0, 10) || [],
  };
  const cricRanking = {
    men: {
      ODI: { ...ODI },
      Tests: { ...Tests },
      T20: { ...T20 },
    },
    women: {
      ODI: { ...ODIWomen },
      Tests: { ...TestsWomen },
      T20: { ...T20Women },
    },
  };

  return {
    status: true,
    statusCode: 200,
    message: "Cric Ranking data fetched successfully",
    data: {
      lastUpdated : rankings.updatedAt,
      men : cricRanking.men,
      women : cricRanking.women
    }
  };
};

exports.pointsTableByCompId = async (activity, comp_id) => {
  const collectionName = "points_table";
  let pointsTableModel;
  comp_id = parseInt(comp_id);
  if (isNaN(comp_id)) {
    return {
      status: false,
      message: "Invalid comp_id: must be a number",
      statusCode: 400,
    };
  }
  if (mongoose.models[collectionName]) {
    pointsTableModel = mongoose.model(collectionName);
  } else {
    const pointsTableSchema = new mongoose.Schema({}, { strict: false });
    pointsTableModel = mongoose.model(collectionName, pointsTableSchema);
    console.log(`${activity} Created a collection: ${collectionName}`);
  }
  const pointsTable = await pointsTableModel.findOne({ cid: comp_id });

  return {
    status: true,
    message: `fetched points table successfully for competition id : ${comp_id}`,
    statusCode: 200,
    data: pointsTable,
  };
};
