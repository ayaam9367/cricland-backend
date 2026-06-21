const WebSocket = require("ws");
const {
  matchIds,
  CurrentlyLiveMatch,
} = require("./utility/constants/constants.js");
const { redisClient, pub, sub } = require("./Redisclient.js");
const { fetchLiveMatchData } = require("./fetchlivedata.js");
const { getModel } = require("./utility/storeData/storeMatchData.js");

const matchRooms = new Map();

const logger = {
  info: (msg) => console.log(` ${msg}`),
  error: (msg, err) => console.error(`${msg}`, err),
};
/**
 JavaScript property 101 : 
 info and error are properties of logger object. Since in JS, functions are 
 first class values, they can be assigned to object properties just like 
 any other values, like strings or integers 

 however, arrow function do not have their own `this` keyword
 hence : 
 const logger = {
  prefix : '[LOG] ',
  info : (msg) => {
    console.log(this.prefix); //undefined
    }
 }

 thus, it if we wish to use other properties in the object, it is 
 preferrable to use ES6 syntax
 const logger = {
  prefix : '[LOG] ',
  info(msg){
    console.log(this.prefix); //"[LOG] "
  }
 }
 */

// Subscribe to Redis match-updates channel
async function initializeRedisSubscription() {
  try {
    await sub.subscribe("match-updates");
    // logger.info("Subscribed to match-updates channel");
  } catch (err) {
    // logger.error("Failed to subscribe to match-updates:", err);
  }
}

sub.on("connect", () => logger.info("Redis client connected"));
sub.on("error", (err) => logger.error("Redis connection error:", err));

function validateMessage(message) {
  try {
    const parsed = JSON.parse(message);
    if (!parsed.type || !parsed.matchId) {
      throw new Error("Missing type or matchId");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Invalid message format: ${err.message}`);
  }
}

/**
 * add the ws connection to the matchRooms map, against matchId key
 */

async function handleJoinRoom(ws, matchId) {
  //if the current match is not live, send error that there is no live match
  if (!CurrentlyLiveMatch.has(matchId)) {
    ws.send(JSON.stringify({ type: "error", message: "No live match found" }));
    ws.close();
    return;
  }

  //matchIds Set contains all the matches we are tracking, if our match 
  //is not present in the set, add it.
  if (!matchIds.has(matchId)) {
    matchIds.add(matchId);
    // logger.info(`Tracking new match ID: ${matchId}`);
  }

  /**
   * matchRooms is a map
   * key - matchId, value - all the clients connected to a match
   * if a match room does not track a particular given match, add it
   * now for the ws connection, add it to the matchId set in the matchRooms
   */
  if (!matchRooms.has(matchId)) {
    matchRooms.set(matchId, new Set());
  }
  matchRooms.get(matchId).add(ws);
  ws.matchId = matchId;
  // logger.info(`Client joined room: ${matchId}`);
  //once a client joins a matchRoom against a certain matchId, we fetch live
  //data for that client and send it immediately
  try {
    const liveData = await fetchLiveMatchData(matchId);
    if (liveData) {
      ws.send(JSON.stringify({ type: "liveData", data: liveData }));
      logger.info(`Sent initial live data for match: ${matchId}`);
    }
  } catch (err) {
    logger.error(`Failed to fetch live data for match ${matchId}:`, err);
  }
}

/**
 * when a client disconnects
 *  remove the client from the matchRoom
 *  if a room has become empty, then remove the matchId;
 */
function handleClientDisconnect(ws) {
  const { matchId } = ws;
  if (matchId && matchRooms.has(matchId)) {
    const room = matchRooms.get(matchId);
    room.delete(ws);
    logger.info(`Client left room: ${matchId}`);
    if (room.size === 0) {
      matchRooms.delete(matchId);
      matchIds.delete(matchId);
      logger.info(`Removed empty room: ${matchId}`);
    }
  }
}

function broadcastToRoom(matchId, liveData) {
  const clients = matchRooms.get(String(matchId));
  if (!clients) return;

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "liveData", data: liveData }));
    }
  }
}

/**
 * once a match completes - 
 *  remove the match from currently live match set
 *  remove the match from matchIds set
 *  remove the particular match from match rooms 
 * 
 *  now we need to update the status of the match in the database
 *    get the match model
 *    update status_str and status
 */
async function handleMatchCompletion(matchId, liveData) {
  CurrentlyLiveMatch.delete(matchId);
  matchIds.delete(matchId);
  matchRooms.delete(matchId);
  logger.info(`Match ${matchId} completed or cancelled`);

  try {
    const todayMatchModel = getModel("match_today");
    await todayMatchModel.findOneAndUpdate(
      { match_id: Number(matchId) },
      { $set: { status_str: "Completed", status: 3 } },
      { new: true },
    );
    logger.info(`Updated match ${matchId} status in database`);
  } catch (err) {
    logger.error(`Failed to update match ${matchId} status:`, err);
  }
}

function socketHandler(server) {
  const wss = new WebSocket.Server({ server });
  initializeRedisSubscription(); // first of all, initialize pub-subs

  /**
   * when a client joins the website and creates a connection
   *    when a client joins a room
   *    when a client closes a connection
   */

  wss.on("connection", (ws) => {
    logger.info("New client connected");
    ws.send(JSON.stringify({ type: "ping", message: "connected" }));

    // Handle incoming messages
    ws.on("message", async (message) => {
      try {
        const parsed = validateMessage(message);
        if (parsed.type === "join-room") {
          await handleJoinRoom(ws, parsed.matchId);
        }
      } catch (err) {
        logger.error("Message processing error:", err);
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    });

    ws.on("close", () => {
      logger.info("Client disconnected");
      handleClientDisconnect(ws);
    });

    ws.on("error", (err) => logger.error("WebSocket error:", err));
  });

  /**
   * subscriber receives live-match-data and 
   * matchId on the channel - match updates
   *    if a match gets completed, we need to handle match completion. 
   */

  sub.on("message", async (channel, message) => {
    if (channel !== "match-updates") return;

    try {
      const { liveData, matchId } = JSON.parse(message);
      broadcastToRoom(matchId, liveData);

      if (
        liveData?.status === "Completed" ||
        liveData?.status === "Cancelled"
      ) {
        await handleMatchCompletion(matchId, liveData);
      }
    } catch (err) {
      logger.error("Redis message processing error:", err);
    }
  });

  return wss;
}

module.exports = { socketHandler };
