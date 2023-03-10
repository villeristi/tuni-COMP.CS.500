const mongoose = require('mongoose');

const { DEFAULT_DBURL } = require('../constants');

// Disable nag
mongoose.set('strictQuery', true);

/**
 * Get database connect URL.
 *
 * Returns the MongoDB connection URL from DBURL environment variable,
 * or if the environment variable is not defined, return the default URL
 * mongodb://localhost:27017/WebShopDb
 *
 * @returns {string} connection URL
 */
const getDbUrl = () => process.env.DBURL ?? DEFAULT_DBURL;

const handleCriticalError = (err) => {
  console.error(err);
  throw err;
};

const disconnectDB = () => {
  mongoose.disconnect();
};

const connectDB = () => {
  // Do nothing if already connected
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    mongoose
      .connect(getDbUrl(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: true,
      })
      .then(() => {
        mongoose.connection.on('error', (err) => {
          console.error(err);
        });

        mongoose.connection.on('reconnectFailed', handleCriticalError);
      })
      .catch(handleCriticalError);
  }
};

module.exports = { connectDB, disconnectDB, getDbUrl };
