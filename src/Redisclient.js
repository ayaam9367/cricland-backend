const { default: Redis } = require("ioredis");

const redisClient = new Redis({
    host: process.env.REDIS_HOST,   
    port: process.env.REDIS_PORT
}); 

const pub = new Redis({
    host: process.env.REDIS_HOST,    
    port: process.env.REDIS_PORT
});

const sub = new Redis({
    host: process.env.REDIS_HOST,   
    port: process.env.REDIS_PORT
});







// sub.subscribe("match-updates", (err, count) => {
//   if (err) {
//     console.error(`Failed to subscribe:`, err);
//   } else {
//     console.log(`Subscribed to match-updates channel (${count} channels)`);
//   }
// });

// // Connect to the Redis client
// sub.on("connect", () => {
//   console.log("Redis client connected successfully!");
// });

// // Handle Redis connection errors
// sub.on("error", (error) => {
//   console.error("Redis connection error:", error);
// });

module.exports = {redisClient , pub , sub}