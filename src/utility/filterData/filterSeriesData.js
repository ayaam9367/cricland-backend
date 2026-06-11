const fetchSeriesData = require("../fetchData/fetchSeriesData");

async function currentSeries() {
  const activity = "Filter Current Series Data |";
  try {
    const result = await fetchSeriesData.currentSeries();
    if (result.error) {
      console.error(`${activity} Error in fetching current series data`);
      return [];
    }
    return result;
  } catch (error) {
    console.error(
      `${activity} Error while filtering current series data : ${error}`
    );
    return error;
  }
}

module.exports = { currentSeries };
