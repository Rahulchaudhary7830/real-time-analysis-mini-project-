const Event = require('../models/Event');
const Metric = require('../models/Metric');
const redis = require('redis');
const { REDIS_URL, CACHE_TTL } = require('../config/index');

let redisClient;
let isRedisReady = false;

(async () => {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => {
      isRedisReady = false;
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Client Error', err);
      }
    });
    redisClient.on('connect', () => {
      console.log('Redis connected');
      isRedisReady = true;
    });
    redisClient.on('end', () => {
      isRedisReady = false;
    });
    await redisClient.connect();
  } catch (err) {
    console.log('Redis connection failed, analytics will proceed without cache');
    isRedisReady = false;
  }
})();

const getDAU = async (req, res) => {
  try {
    const cacheKey = 'dau_stats';
    let cachedData = null;
    
    if (isRedisReady && redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {}
    }

    if (cachedData) return res.json(JSON.parse(cachedData));

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dau = await Event.distinct('userId', {
      timestamp: { $gte: startOfDay },
      userId: { $regex: /^(?!guest_)/ }
    });

    const response = { dau: dau.length, date: startOfDay };
    
    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (err) {}
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching DAU:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getWAU = async (req, res) => {
  try {
    const cacheKey = 'wau_stats';
    let cachedData = null;
    if (isRedisReady && redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {}
    }
    if (cachedData) return res.json(JSON.parse(cachedData));

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const wau = await Event.distinct('userId', {
      timestamp: { $gte: startOfWeek },
      userId: { $regex: /^(?!guest_)/ }
    });

    const response = { wau: wau.length, date: startOfWeek };
    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (err) {}
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching WAU:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getRevenue = async (req, res) => {
  try {
    const cacheKey = 'revenue_stats';
    let cachedData = null;
    if (isRedisReady && redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {}
    }
    if (cachedData) return res.json(JSON.parse(cachedData));

    const revenueData = await Event.aggregate([
      { $match: { eventType: 'purchase' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$metadata.revenue' } } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    const response = { totalRevenue };
    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (err) {}
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getEventCounts = async (req, res) => {
  try {
    const cacheKey = 'event_counts';
    let cachedData = null;
    if (isRedisReady && redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {}
    }

    if (cachedData) return res.json(JSON.parse(cachedData));

    const counts = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(counts));
      } catch (err) {}
    }
    res.json(counts);

  } catch (error) {
    console.error('Error fetching event counts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getFunnel = async (req, res) => {
  try {
    const cacheKey = 'funnel_stats';
    let cachedData = null;
    if (isRedisReady && redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {}
    }
    if (cachedData) return res.json(JSON.parse(cachedData));

    const funnelSteps = ['view', 'click', 'purchase'];
    const funnel = [];

    for (const step of funnelSteps) {
      const users = await Event.distinct('userId', { eventType: step });

      funnel.push({ step, count: users.length });
    }

    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(funnel));
      } catch (err) {}
    }
    res.json(funnel);
  } catch (error) {
    console.error('Error fetching funnel:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

};

const resetData = async (req, res) => {
  try {
    await Event.deleteMany({});
    await Metric.deleteMany({});
    
    if (isRedisReady && redisClient.isOpen) {
      try {
        await redisClient.flushAll();
      } catch (err) {}
    }
    
    res.json({ message: 'All data and cache have been reset successfully' });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getDAU,
  getWAU,
  getRevenue,
  getEventCounts,
  getFunnel,
  resetData,
};
