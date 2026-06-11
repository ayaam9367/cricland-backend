const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const tz = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(tz);

async function matchToday() {
  // const status = 1; 
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "days").format("YYYY-MM-DD");
  let paged = 1;
  const params = {
    date: `${today}_${today}`,
    token: process.env.API_TOKEN,
    paged,
  };
  const url = `${process.env.BASE_URI}/v2/matches`;
  const activity = `Fetch Match Today Data |`;
  try {
    // Fetch data from the API
    let dataFetched = await axios.get(url , {params});
    
    // Check if the response contains items
    if (!dataFetched.data.response.items.length) {
      console.warn(`${activity} No matches found`);
      return [];
    }

    const matches = [...dataFetched.data.response.items];

    // Handle pagination
    // console.log(dataFetched.data.response.total_pages)
    const totalPages = dataFetched.data.response.total_pages
    // console.log(matches.length)
    // console.log("current page" , paged)
    while (paged < totalPages) {
      paged++; 
      params.paged = paged; 
      dataFetched = await axios.get(url, { params });
      const items = dataFetched.data?.response?.items || [];
      matches.push(...items);
      console.log(`Matches fetched from page ${paged}: ${items.length}`);
    }

    console.log(`Total matches fetched: ${matches.length}`);
    
    return matches;
  } catch (error) {
    console.error(`${activity} Error while fetching matches today: ${error.message}`);
    throw error; 
  }
}


async function GetallMatches(cid) {
  const url = `${process.env.BASE_URI}v2/competitions/${cid}/matches`;
  const activity = `Fetch Series Match Data |`;
  let paged = 1;
  const per_page = 50; 
  const params = {
    token: process.env.API_TOKEN,
    paged,
    per_page,
  };
  // const fetchedMatchIds = new Set(); 
  const matches = [];

  try {
    // const url = `${baseUrl}?token=${process.env.API_TOKEN}&page=${paged}&limit=${per_page}`;
    let dataFetched = await axios.get(url ,{params} );

    if (!dataFetched.data.response?.items?.length) {
      console.warn(`${activity} No matches found for cid: ${cid}`);
      return [];
    }

    // const firstPageItems = dataFetched.data.response.items;
    // for (const match of firstPageItems) {
    //   if (!fetchedMatchIds.has(match.match_id)) {
    //     matches.push(match);
    //     fetchedMatchIds.add(match.match_id);
    //   }
    // }

    matches.push(...dataFetched.data.response.items);

    const totalPages = dataFetched.data.response.total_pages;
    const totalItems = dataFetched.data.response.total_items;
    let currentCount = matches.length;

    console.log(
      `${activity} Fetched ${matches.length} matches from page 1 | Total Items: ${totalItems} | Total Pages: ${totalPages}`
    );

   
    while (currentCount < totalItems && paged < totalPages) {
      paged++;
      params.paged = paged;
      console.log(`${activity} Fetching page ${paged} with limit ${per_page}`);
      dataFetched = await axios.get(url, { params });

      const items = dataFetched.data?.response?.items || [];
      for (const match of items) {
          matches.push(match);
        
      }

      currentCount = matches.length;
      console.log(`${activity} Matches fetched from page ${paged}: ${items.length} | Total so far: ${currentCount}`);
    }

    
    if (matches.length !== totalItems) {
      console.warn(
        `${activity} Mismatch in fetched matches: Expected ${totalItems}, Got ${matches.length}`
      );
    }
    console.log(`${activity} Total matches fetched: ${matches.length}`);
    return matches;
  } catch (error) {
    console.error(`${activity} Error while fetching all matches for cid ${cid}: ${error.message}`);
    throw error;
  }
}



module.exports = {
  matchToday,
  GetallMatches
};