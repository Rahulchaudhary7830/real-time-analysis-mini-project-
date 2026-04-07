const { eventQueue } = require('../config/queue');
const useragent = require('useragent');

const collectEvent = async (req, res) => {
  try {
    const { userId, eventType, metadata, timestamp } = req.body;

    if (!userId || !eventType) {
      return res.status(400).json({ error: 'userId and eventType are required' });
    }

    const agent = useragent.parse(req.headers['user-agent']);
    const device = agent.toString();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const eventPayload = {
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: timestamp || new Date().toISOString(),
      device,
      ip,
      receivedAt: new Date().toISOString()
    };

    await eventQueue.add('process-event', eventPayload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    res.status(202).json({ 
      message: 'Event accepted for processing',
      status: 'queued'
    });
  } catch (error) {
    console.error('Error collecting event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  collectEvent,
};
