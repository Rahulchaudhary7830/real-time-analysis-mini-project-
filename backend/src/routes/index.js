const express = require('express');
const router = express.Router();
const { collectEvent } = require('../controllers/EventController');
const { 
  getDAU, 
  getWAU, 
  getRevenue, 
  getEventCounts, 
  getFunnel,
  resetData
} = require('../controllers/AnalyticsController');

// Event Collection
router.post('/event', collectEvent);


// Analytics APIs
router.get('/dau', getDAU);
router.get('/wau', getWAU);
router.get('/revenue', getRevenue);
router.get('/events/count', getEventCounts);
router.get('/funnel', getFunnel);
router.delete('/reset', resetData);

module.exports = router;
