const axios = require("axios");
const { redisClient, pub } = require("./Redisclient");
const { matchIds } = require("./utility/constants/constants");

const fetchLiveMatchData = async (matchId) => {
  try {
    const response = await axios.get(
      `${process.env.BASE_URI}/v2/matches/${matchId}/live?token=${process.env.API_TOKEN}`
    );

    const data = response?.data?.response;
    // console.log(data)
    const lw = data?.live_inning?.last_wicket
    const { live_score: score,live_inning: liveInning, teams, batsmen, bowlers } = data;
    const batsman1 = batsmen && batsmen[0] ? batsmen[0] : {};
    const batsman2 = batsmen && batsmen[1] ? batsmen[1] : {};
    const bowler1 = bowlers && bowlers[0] ? bowlers[0] : {};  

    const liveData = {
      matchId,
      matchcurrentsituation: data?.status_note,
      currentstatus: data?.game_state_str,
      statusno: data?.status,
      status: data?.status_str,
      runs: score?.runs,
      target: score?.target,
      wickets: score?.wickets,
      crr: score?.runrate,
      rrr: score?.required_runrate || 0,
      lw:lw || 0,
      inningDetails: {
        inningId: liveInning?.id,
        inningName: liveInning?.name,
        scores: liveInning?.scores_full,
        overs: liveInning?.equations?.overs || "0",
        maxOver: liveInning?.max_over,
      },
      Team: teams?.map((team) => ({
        id: team?.tid,
        name: team?.title,
        abbreviation: team?.abbr,
        logo: team?.logo_url,
        scores_full: team?.scores_full,
        scores:team?.scores,
        overs:team?.overs
      })),
      batsmen: {
        batsman1: {
          name: batsman1.name || '',
          runs: batsman1.runs || 0,
          balls_faced: batsman1.balls_faced || 0,
          strike_rate: batsman1.strike_rate || '0.00',
        },
        batsman2: {
          name: batsman2.name || '',
          runs: batsman2.runs || 0,
          balls_faced: batsman2.balls_faced || 0,
          strike_rate: batsman2.strike_rate || '0.00',
        }
      },
      bowlers: {
        bowler1: {
          name: bowler1.name || '',
          overs: bowler1.overs || 0,
          runs_conceded: bowler1.runs_conceded || 0,
          wickets: bowler1.wickets || 0,
          econ: bowler1.econ || '0.00',
        },
      },
      lastover: liveInning?.recent_scores,
    };


    // Publish to Redis
    await pub.publish("match-updates", JSON.stringify({ matchId, liveData }));
    // console.log(`Published live data for match ${matchId} to Redis`, liveData);
    // return liveData.currentstatus;
    return liveData;
  } catch (error) {
    console.error(
      `Error fetching live data for match ${matchId}:`,
      error.message
    );
    return null;
  }
};   

async function pollLiveData() {
  if (matchIds.size === 0) {
    // console.log("No active matches to poll");
    return;
  }

 console.log(`Polling data for ${matchIds.size} matches`);
  await Promise.all([...matchIds].map(async (matchId) => {
    const liveData = await fetchLiveMatchData(matchId);
    if (liveData?.status === "Completed" || liveData?.status === "Cancelled") {
      matchIds.delete(matchId); 
    }
  }));
}


setInterval(pollLiveData, 3000);


module.exports = { fetchLiveMatchData };
