const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        //since we are connecting to a single DB, we will use mongoose.connect()
        const connection = await mongoose.connect(process.env.MONGO_URL);
        console.log(`🗄️ MongoDB is connected to ${process.env.MONGO_URL}`);

        //if we get an error while connecting to our DB, we will catch
        mongoose.connection.on('error', err => {
            console.error("❌ MongoDB Connection Error:", err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
            setTimeout(() => {
                if (mongoose.connection.readyState === 0) { // 0 means disconnected
                    console.warn('🛠️ Mongoose still disconnected, attempting manual reconnection...');
                    connectDatabase().catch(err => {
                        console.error("Reconnect Failed: ", err);
                    });
                }
            }, 5000);
        });

        return connection;  
    } catch (err) {
        console.error(`❌ Error in connecting to ${process.env.MONGO_URL}`, err);
    }
};

module.exports = connectDatabase;

/**
 * Issue : I don't think mongodb connects on the start of the server if redis is disconnected
 * Replication steps : 
 * 1. Stop the redis container
 * 2. start the server
 * 3. You will get ECONREFUSED for port 6379 (redis)
 * 4. Test if mongodb is connected, if not, correct it
 * 5. Start the redis container
 * 6. Repeat Step 4
 * 
 * Issue : Connect database is not a solid function, can improve it. 
 * 
 */