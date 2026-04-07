require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://chrahul7830_db_user:VD5MbWuYgpK7Y192@database.nwbuhez.mongodb.net/?appName=DataBase',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  QUEUE_NAME: 'analytics-events',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  CACHE_TTL: 3600,
};
