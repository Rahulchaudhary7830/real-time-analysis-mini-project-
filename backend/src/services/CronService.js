const cron = require('node-cron');
const Event = require('../models/Event');
const Metric = require('../models/Metric');

const precomputeDailyMetrics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const users = await Event.distinct('userId', {
      timestamp: { $gte: yesterday, $lt: today }
    });
    const dauCount = users.length;

    await Metric.findOneAndUpdate(
      { metricName: 'DAU', date: yesterday },
      { value: dauCount },
      { upsert: true }
    );

    const revenueData = await Event.aggregate([
      { $match: { eventType: 'purchase', timestamp: { $gte: yesterday, $lt: today } } },
      { $group: { _id: null, total: { $sum: '$metadata.revenue' } } }
    ]);

    const dailyRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    await Metric.findOneAndUpdate(
      { metricName: 'DailyRevenue', date: yesterday },
      { value: dailyRevenue },
      { upsert: true }
    );

    console.log('Daily metrics precomputed for:', yesterday);
  } catch (error) {
    console.error('Error in daily metrics precomputation:', error);
  }
};

const archiveOldData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Event.deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });

    console.log(`Archived ${result.deletedCount} old events.`);
  } catch (error) {
    console.error('Error in data archival job:', error);
  }
};

cron.schedule('1 0 * * *', precomputeDailyMetrics);
cron.schedule('0 2 * * 0', archiveOldData);

module.exports = {
  precomputeDailyMetrics,
  archiveOldData
};
