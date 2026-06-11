const { cricRankingData } = require("../utility/fetchDataFromDB/homepage");
const homepageServices = require("../services/homepage.services");
const { storePointsTable } = require("../utility/storeData/storeHomepageData");
const matchService = require("../services/matchService");

exports.cricRankingHomepage = async (req, res) => {
  const activity = "Cric Rankings Homepage |";
  try {
    const {
      status = false,
      statusCode = 500,
      message = "",
      data = {},
    } = await homepageServices.cricRankingData(activity);

    res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (error) {
    console.log(`${activity} ${error.message}`);
    res.status(error?.statusCode || 500).send({
      status: false,
      message: `Error while fetching Cric Ranking Data | ${error.message}`,
    });
  }
};

exports.pointsTable = async (req, res) => {
  const activity = "Fetch Points Table |";
  try {
    let {
      status: seriesStatus = false,
      code: seriesStatusCode = 500,
      data: seriesData = [],
      message:
        seriesMessage = "Error occured while fetching current live series",
    } = await matchService.Currentliveseries(activity);

    if (!seriesStatus) {
      console.log(`${activity} Error occured while fetching current live series ${error.message}`); 
      return res.status(seriesStatusCode).send({
        status: seriesStatus,
        message: seriesMessage,
      });
    }

    const comp_id = seriesData[0].cid;

    let {
      data = {},
      status = false,
      message = "",
      statusCode = 500,
    } = await homepageServices.pointsTableByCompId(activity, comp_id);

    if (!data) {
      const response = await storePointsTable(comp_id);
      if (!response.status) {
        status = false;
        message = `no points table found for comp_id: ${comp_id} `;
      }
      data = response.data;
    }

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (error) {
    console.log(`${activity} ${error.message}`);
    res.status(error.statusCode || 500).send({
      status: false,
      message: `${activity} Error while fetching points table`,
    });
  }
};

exports.pointsTableByCompId = async (req, res) => {
  const activity = "Fetch Points Table by Competition Id |";
  try {
    const comp_id = req?.params?.cid;
    if (!comp_id) {
      res.status(400).send({
        status: false,
        message: "competition id is necessary to fetch points table",
      });
    }
    let {
      data = {},
      status = false,
      message = "",
      statusCode = 500,
    } = await homepageServices.pointsTableByCompId(activity, comp_id);

    if (!data) {
      const response = await storePointsTable(comp_id);
      if (!response.status) {
        status = false;
        message = `no points table found for comp_id: ${comp_id} `;
      }
      data = response.data;
    }

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (error) {
    console.log(`${activity} ${error.message}`);
    return res.status(error.statusCode || 500).send({
      status: false,
      message: error?.message,
    });
  }
};
