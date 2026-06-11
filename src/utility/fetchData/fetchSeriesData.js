const axios = require("axios");
var cron = require('node-cron');
/**
 * fetching the series which is live currently.
 * we can set the parameter status as live
 * since there might be multple pages of series that might be live, we will have to iterate over the pages to fetch all of them
 *
 * @returns an array of all the series which are live.
 */

async function currentSeries() {
  const activity = "Fetch Current Series Data |";
  let url = `${process.env.BASE_URI}/v2/competitions`;
  let paged = 1;
  let status="live"
  let params = {
    status,
    token: process.env.API_TOKEN,
    paged
  };
  try {
    let dataFetched = await axios.get(url , {params});
    if (dataFetched.data.response.items.length === 0) {
      console.warn(`${activity} No series fetched`);
      return [];
    }

    const series = [...dataFetched.data.response.items];

    const totatpage = dataFetched?.data?.response?.total_pages
    // console.log("totalpage" , totatpage)

    while (paged < totatpage) {
      paged++;
      params.paged = paged;
      dataFetched = await axios.get(url, { params });
      const items = [...dataFetched.data?.response?.items];
      series.push(items);
    }
    // console.log("series count" , series?.length)
    return series;
  } catch (error) {
    console.error(
      `${activity} Error while fetching current series data: ${error.message}`
    );
    return { error };
  }
}


async function allSeries() {
  const activity = "Fetch Current Series Data |";
  let url = `${process.env.BASE_URI}/v2/competitions`;
  let paged = 1;
  // let status="live"
  let date = "01-01-2025_01-12-2025"
  let params = {
    date,
    token: process.env.API_TOKEN,
    paged
  };
  try {
    let dataFetched = await axios.get(url , {params});
    if (dataFetched.data.response.items.length === 0) {
      console.warn(`${activity} No series fetched`);
      return [];
    }

    const series = [...dataFetched.data.response.items];

    const totatpage = dataFetched?.data?.response?.total_pages
    // console.log("totalpage" , totatpage)

    while (paged < totatpage) {
      paged++;
      params.paged = paged;
      dataFetched = await axios.get(url, { params });
      const items = [...dataFetched.data?.response?.items];
      series.push(items);
    }
    // console.log("series count" , series?.length)
    return series;
  } catch (error) {
    console.error(
      `${activity} Error while fetching current series data: ${error.message}`
    );
    return { error };
  }
}



module.exports = { currentSeries , allSeries };
