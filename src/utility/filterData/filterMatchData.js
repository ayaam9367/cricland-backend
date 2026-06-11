const axios = require("axios");
const fetchMatchData = require("../fetchData/fetchMatchData");

/**
 * sorting the match today data based on timestamp_start
 * @returns 
 */
async function matchToday() {
  const activity = "Filter Match Today Data |";
  try {
    const result = await fetchMatchData.matchToday();
    if (result.error) {
      console.error(`${activity} Error in match data: ${result.error}`);
      return [];
    }
    result.sort((a,b) => a.timestamp_start - b.timestamp_start);
    // console.log(result)
    return {result};
  } catch (error) {
    console.error(
      `${activity} Error while filtering match today data: ${error.message}`
    );
    return { error };
  }
}

module.exports = { matchToday };
