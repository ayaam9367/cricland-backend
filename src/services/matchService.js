const { redisClient } = require("../Redisclient");
const { CurrentlyLiveMatch } = require("../utility/constants/constants");
const { getModel } = require("../utility/storeData/storeMatchData");
const axios = require("axios");
const Tournamenttl = require("../Models/tournament");
const { runGetAllMatchesIfNotExists } = require("../utility/helper/helper");

async function filtermatchs(todayMatch) {
  const liveMatches = [];
  const scheduledMatches = [];
  const completedMatches = [];

  const liveMatchCurr = [];
  const currentTimestamp = Date.now();

  for (const match of todayMatch) {
    const matchStartTime = match.timestamp_start * 1000;
    const matchEndTime = match.timestamp_end * 1000;
    const isIPL = match.competition.cid === 129413;
    const preMatchTime = isIPL ? matchStartTime - 15 * 60 * 1000 : null; 

    if (currentTimestamp > matchEndTime) {
      completedMatches.push(match);
      continue;
    }

    if (isIPL) {
     
      if (currentTimestamp >= preMatchTime && currentTimestamp <= matchEndTime) {
        if (match.status_str === "Live") {
          liveMatchCurr.push(match.match_id);
          liveMatches.push(match);
          CurrentlyLiveMatch.add(String(match.match_id));
        } else if (match.status_str === "Completed") {
          completedMatches.push(match);
        } else {
        
          liveMatchCurr.push(match.match_id);
          liveMatches.push(match);
          CurrentlyLiveMatch.add(String(match.match_id));
        }
      } else if (currentTimestamp < preMatchTime) {
        scheduledMatches.push(match);
      }
    } else {
     
      if (currentTimestamp >= matchStartTime && currentTimestamp <= matchEndTime) {
        if (match.status_str === "Live") {
          liveMatchCurr.push(match.match_id);
          liveMatches.push(match);
          CurrentlyLiveMatch.add(String(match.match_id));
        } else if (match.status_str === "Completed") {
          completedMatches.push(match);
        } else {
        
          liveMatchCurr.push(match.match_id);
          liveMatches.push(match);
          CurrentlyLiveMatch.add(String(match.match_id));
        }
      } else if (currentTimestamp < matchStartTime) {
        scheduledMatches.push(match);
      }
    }
  }

  completedMatches.sort((a, b) => {
    const isA_IPL = a.competition.cid === 129413;
    const isB_IPL = b.competition.cid === 129413;

    if (isA_IPL && !isB_IPL) return -1;
    if (!isA_IPL && isB_IPL) return 1;
    return b.timestamp_end - a.timestamp_end;
  });

  const recentCompletedMatches = completedMatches.slice(0, 6);

  const processMatches = (matches, status) =>
    (matches || []).map((match) => ({
      TeamA: match.teama.logo_url,
      TeamAName: match.teama.short_name,
      Title: match.short_title,
      TeamB: match.teamb.logo_url,
      TeamBName: match.teamb.short_name,
      Venue: match.venue.location,
      VenueStadium: match.venue.name,
      time: match.date_start_ist,
      Series: match.competition.title,
      match_id: match.match_id,
      cid: match.competition.cid,
      subtitle: match.subtitle,
      Status: status,
      ...(status === "LIVE" && {
        statusColor: "bg-[#116530]",
        textColor: "text-white",
        borderColor: "border-[#116530]",
      }),
      ...(status === "Result" && {
        textColor: "text-[#116530]",
        statusColor: "bg-white",
        borderColor: "border-[#116530]",
      }),
    }));

  const allMatches = [
    ...processMatches(liveMatches, "LIVE"),
    ...processMatches(scheduledMatches, "Upcoming"),
    ...processMatches(recentCompletedMatches, "Result"),
  ];

  return {
    allMatches,
  };
}

exports.getAlltodaymatch = async (activity, { page, limit, pagination, search='' }) => {
  const todaymatch1 = getModel("match_today");
  let matchQuery = todaymatch1.find().sort({ _id: -1 });

   if (search) {
    matchQuery = matchQuery.where("competition.abbr").regex(new RegExp(search, 'i'));  
  }

  if (pagination) {
    matchQuery = matchQuery.skip((page - 1) * limit).limit(limit);
  }

  const [todayMatch, totalMatch] = await Promise.all([
    matchQuery.exec(),
    todaymatch1.countDocuments(),
  ]);
  
  // console.log(todayMatch)
  if (todayMatch.length === 0) {
    return {
      status: true,
      code: 404,
      message: `${activity} No Match Found`,
    };
  }

  const sorted_todayMatch = todayMatch.sort((a, b) => {
    return a.competition.cid === 129413 ? -1 : 0;
  });

  const matches = await filtermatchs(sorted_todayMatch);

  return {
    status: true,
    code: 200,
    message: "Today's matches categorized",
    data: {
      allMatches: matches.allMatches,
      totalMatch,
    },
  };
};
exports.getMatchInfo = async (activity, matchId) => {
  const rediskey = `match:${matchId}`;
  let isLive = CurrentlyLiveMatch.has(matchId);
  if (isLive) {
    return {
      status: true,
      code: 200,
      message: ` ${activity} The match is live.`,
      data: CurrentlyLiveMatch,
      isLive:isLive
    };
  }
  const cacheData = await redisClient.get(rediskey);
  if (cacheData) {
    console.log("Found match ID in Redis");
    return {
      status: true,
      code: 200,
      message: ` ${activity} Match found in cache`,
      data: JSON.parse(cacheData),
      isLive: false,
    };
  }

  try {
    const response = await axios.get(
      `https://rest.entitysport.com/v2/matches/${matchId}/info?token=${process.env.API_TOKEN}`
    );
    // console.log("API Response:", response.response);
    if (!response.data || !response.data.response) {
      return {
        status: true, 
        code: 200,
        message: `${activity} No data available for this match.`,
        data:response.data,
        isLive: false
      };
    }
    const data = response.data;
    // console.log(data)
    // console.log(data.response.status)
    if (data.response.status === 1) {
      redisClient.setex(rediskey, 3600, JSON.stringify(data), (err, reply) => {
        if (err) {
          console.error('Error setting Redis key:', err);
        } else {
          console.log('Redis key set successfully with short expiry:', reply);
        }
      });
    } else {
      redisClient.setex(rediskey, 28800, JSON.stringify(data), (err, reply) => {
        if (err) {
          console.error('Error setting Redis key:', err);
        } else {
          console.log('Redis key set successfully:', reply);
        }
      });
    }
    return {
      status: true,
      code: 200,
      isLive: false,
      message: `Match Data found`,
      data:response.data
    };
  } catch (error) {
    return {
      status: false,
      code: 400,
      isLive: false,
      message: `error not good`,
      data:null
    };
  }
};

exports.Currentliveseries = async (activity) => {
  
  const todaymatch1 = getModel("current_series");
  const current_series = await todaymatch1.find({status:"live"});
  if (!current_series) {
    return {
      status: true,
      message: "No series is live currently",
      code: 404,
      data: null,
    };
  }

  const sorted_series = current_series.sort((a, b) => {
    return a.cid === 129413 ? -1 : 0;
  });
  
  return {
    status: true,
    message: "found all live series",
    code: 200,
    data: sorted_series,
  };
};
 
exports.SeriesAllMatch = async (activity, cid, { page, limit, pagination, name }) => {
  const cachekey = `competition:${cid}:matches`;
  const cacheData = await redisClient.get(cachekey);

  let tournamentData;

  if (cacheData) {
    tournamentData = JSON.parse(cacheData);
  } else {
    let data = await Tournamenttl.findOne({ cid });
    if (!data) {
      await runGetAllMatchesIfNotExists(cid);
      data = await Tournamenttl.findOne({ cid });
    }
    if (!data) {
      return {
        status: false,
        code: 404,
        message: "No matches found",
        data: null,
      };
    }
    tournamentData = data;
    await redisClient.setex(cachekey, 18000, JSON.stringify(tournamentData));
  }

  if (!tournamentData) {
    return {
      status: false,
      code: 404,
      message: "No matches found",
      data: null,
    };
  }

  let filteredMatches = tournamentData.matchs;

  if (name) {
    const searchName = name.toLowerCase();
    filteredMatches = filteredMatches.filter(match => {
      return (
        match.matchName?.toLowerCase().includes(searchName) ||
        match.matchTeama?.name?.toLowerCase().includes(searchName) ||
        match.matchTeama?.shortname?.toLowerCase().includes(searchName) ||
        match.matchTeamb?.name?.toLowerCase().includes(searchName) ||
        match.matchTeamb?.shortname?.toLowerCase().includes(searchName)
      );
    });
  }
  

  const totalItems = filteredMatches.length;

  if (pagination) {
    const skip = (page - 1) * limit;
    filteredMatches = filteredMatches.slice(skip, skip + limit);
  }

  return {
    status: true,
    code: 200,
    data: {
      tournament: {
        cid: tournamentData.cid,
        name: tournamentData.name,
        status: tournamentData.status,
        isfeatured:tournamentData.isfeatured
      },
      matches: filteredMatches,
      ...(pagination && {
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
        }
      }),
    },
    message: "Matches found",
  };
};





exports.UpdateCurrentSeriesMatch = async (activity, cid, matchId, updatedUrls, isfeatured) => {
    const series = await Tournamenttl.findOne({ cid: cid });

    if (!series) {
      return {
        status: false,
        code: 404,
        message: "Tournament not found",
      };
    }
    if (isfeatured !== undefined) {
      series.isfeatured = Boolean(isfeatured);
    }
    const matchIndex = series.matchs.findIndex(
      (match) => match.matchId === matchId
    );
    if (matchIndex === -1) {
      return {
        status: false,
        code: 404,
        message: "Match not found",
      };
    }
    const urls = updatedUrls.urls;
    let matchUrls = series.matchs[matchIndex].urls || new Map();
    if (!(matchUrls instanceof Map)) {
      matchUrls = new Map(Object.entries(matchUrls));
    }
    for (const key in urls) {
      if (urls.hasOwnProperty(key)) {
        if (Array.isArray(urls[key]) && urls[key].length === 0) {
         
          matchUrls.delete(key);
        } else {
          const existingUrls = matchUrls.get(key) || [];
          const updatedUrlList = [...new Set([...existingUrls, ...urls[key]])];
          matchUrls.set(key, updatedUrlList);
        }
      }
    }

    series.matchs[matchIndex].urls = matchUrls;
    await series.save();

    const cachekey = `competition:${cid}:matches`;
    await redisClient.setex(cachekey, 18000, JSON.stringify(series));
    return {
      status: true,
      code: 200,
      message: "Match URLs updated successfully",
      data: series.matchs[matchIndex],
    };
};





exports.getAllSeries = async (activity ,{page , limit , pagination , status , name}) => {

  const SeriesModel = getModel("all_series");
  const searchFilter = {};

  if (status) {
    searchFilter.status = new RegExp(status, "i");  
  }

  if (name) {
    searchFilter.abbr = new RegExp(name, "i");       
  }

  let query = SeriesModel.find(searchFilter);

  if (pagination) {
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
  }
  const allSeries = await query;
  if (!allSeries) {
    return {
      status: true,
      message: "No series is live currently",
      code: 404,
      data: null,
    };
  }
  const liveSeries = allSeries.filter(series => series.status === "live");
  const upcomingSeries = allSeries.filter(series => series.status === "upcoming");
  const resultSeries = allSeries.filter(series => series.status === "result");
  let totalSeries = await SeriesModel.countDocuments(searchFilter);
  const totalPages = Math.ceil(totalSeries / limit);

  return {
    status: true,
    message: "Series grouped by status",
    code: 200,
    data: {
      live: liveSeries,
      upcoming: upcomingSeries,
      result: resultSeries,
      pagination: {
        page,
        limit,
        totalSeries,
        totalPages,
      },
    },
  };
};


exports.UpdateSeries = async (activity, id, isfeatured , imageUrl) => {
    const SeriesModel = getModel("all_series");
    const updatefield = {}


    if(isfeatured){
      updatefield.isfeatured = Boolean(isfeatured)
    }
    if(imageUrl){
      updatefield.logourl = imageUrl
    }
    const allSeries = await SeriesModel.findOneAndUpdate(
      { cid: id },
      { $set: updatefield },
      { new: true, upsert: false } 
    );
    if (!allSeries) {
      return {
        status: false,
        code: 404,
        message: "Series not found",
      };
    }
    await allSeries.save();
    return {
      status: true,
      code: 200,
      message: "Match URLs updated successfully",
      data: allSeries,
    };
}