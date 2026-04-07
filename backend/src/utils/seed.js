const axios = require('axios');
const { PORT } = require('../config/index');

const API_URL = `http://127.0.0.1:${PORT}/api/event`;

const eventTypes = ['view', 'click', 'purchase', 'signup', 'login'];
const userIds = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];

const seedEvents = async (count = 50) => {
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    const metadata = {};
    if (eventType === 'purchase') {
      metadata.revenue = Math.floor(Math.random() * 100) + 10;
    }

    try {
      await axios.post(API_URL, {
        userId,
        eventType,
        metadata,
        timestamp: new Date().toISOString()
      });
      console.log(`Sent event ${i+1}/${count}: ${eventType} for ${userId}`);
    } catch (error) {
      console.error('Error sending event:', error.message);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
};

seedEvents();
