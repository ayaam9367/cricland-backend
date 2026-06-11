const { getAllMatches, matchToday } = require("../utility/storeData/storeMatchData");
const Tournamenttl = require("../Models/tournament");
const { allSeries } = require("../utility/storeData/storeSeriesData");
const { redisClient } = require("../Redisclient");




exports.refreshSeriesMatch = async (activity, cid) => {
    const cachekey = `competition:${cid}:matches`;

    
    await redisClient.del(cachekey);

    
    const match = await getAllMatches(cid);

    return {
        status: true,
        code: 200,
        data: match,
        message: "Series match refreshed successfully"
    };
};


exports.refreshAllSeriesMatch = async (activity) => {

        const updateseries = await allSeries()
        await matchToday()
        return {
            status: true,
            code: 200,
            data: updateseries,
            message: "All series match refreshed successfully"
        };
}