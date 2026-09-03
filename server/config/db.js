const mongoose = require('mongoose');
const { mongoUri, env } = require('./env');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      // Modern Mongoose (8.x) no longer needs useNewUrlParser / useUnifiedTopology,
      // they are defaults, kept here as documentation of intent.
    });

    console.log(`[db] MongoDB connected: ${conn.connection.host} (${env})`);

    mongoose.connection.on('error', (err) => {
      console.error(`[db] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`[db] Initial MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Close the connection cleanly on app termination (used by server.js)
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('[db] MongoDB connection closed');
};

module.exports = { connectDB, disconnectDB };
