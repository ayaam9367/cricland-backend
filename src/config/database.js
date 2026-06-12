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
 * 
 */