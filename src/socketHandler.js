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


async function handleJoinRoom(ws, matchId) {
  if (!CurrentlyLiveMatch.has(matchId)) {
    ws.send(JSON.stringify({ type: "error", message: "No live match found" }));
    ws.close();
    return;
  }

  if (!matchIds.has(matchId)) {
    matchIds.add(matchId);
    // logger.info(`Tracking new match ID: ${matchId}`);
  }

  if (!matchRooms.has(matchId)) {
    matchRooms.set(matchId, new Set());
  }
  matchRooms.get(matchId).add(ws);
  ws.matchId = matchId;
  // logger.info(`Client joined room: ${matchId}`);

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
      { new: true }
    );
    logger.info(`Updated match ${matchId} status in database`);
  } catch (err) {
    logger.error(`Failed to update match ${matchId} status:`, err);
  }
}

function socketHandler(server) {
  const wss = new WebSocket.Server({ server });
  initializeRedisSubscription();

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

 
  sub.on("message", async (channel, message) => {
    if (channel !== "match-updates") return;

    try {
      const { liveData, matchId } = JSON.parse(message);
      broadcastToRoom(matchId, liveData);

      if (liveData?.status === "Completed" || liveData?.status === "Cancelled") {
        await handleMatchCompletion(matchId, liveData);
      }
    } catch (err) {
      logger.error("Redis message processing error:", err);
    }
  });

  return wss;
}

module.exports = { socketHandler };