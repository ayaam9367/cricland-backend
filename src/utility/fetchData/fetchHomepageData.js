const axios = require("axios");

async function fetchCricRanking() {
  const activity = `Fetch Cric-Ranking Data |`;
  const url = `${process.env.BASE_URI}/${process.env.VERSION}/iccranks?token=${process.env.API_TOKEN}`;
  try {
    const response = await axios.get(url);
    const rankings = response.data.response;
    return rankings;
  } catch (error) {
    console.log(`${activity} ${error.message}`);
  }
}

async function fetchPointsTable(comp_id) {
  const activity = "Fetch Points Table Data |";
  try {
    if (!comp_id) {
      console.log(`${activity} comp_id is required for fetching points table`);
      return {
        status: false,
        message: `comp_id is required for fetching points table`,
      };
    }

    let cid = comp_id;

    const url = `${process.env.BASE_URI}/${process.env.VERSION}/competitions/${cid}/standings?token=${process.env.API_TOKEN}`;
    const response = await axios.get(url);
    const rankings = response.data.response.standings;
    if (!rankings.length) {
      console.log(`${activity} no points table found for comp_id : ${cid}`);
      return {
        status: false,
        message: `no points table found for comp_id : ${cid}`,
      };
    }
    const pointsTable = {
      ...rankings,
      cid,
    };
    console.log(`${activity} Fetched Points Table for comp_id : ${comp_id}`);
    return {
      status: true,
      message: `points table fetched for comp_id: ${cid}`,
      data: pointsTable,
    };
  } catch (error) {
    console.log(`${activity} ${error}`);
  }
}

module.exports = { fetchCricRanking, fetchPointsTable };
