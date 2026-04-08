const mongoose = require('mongoose');
const Event = require('../models/Event');
const Metric = require('../models/Metric');

// In-memory fallback stores
let inMemoryEvents = [];
let inMemoryMetrics = [];

class StorageService {
  static isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // --- EVENT OPERATIONS ---

  
  static async saveEvent(eventData) {
    if (this.isConnected()) {
      try {
        const newEvent = new Event(eventData);
        return await newEvent.save();
      } catch (error) {
        console.error('Mongoose saveEvent error:', error.message);
      }
    }
    
    // Fallback to in-memory
    const event = { ...eventData, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
    inMemoryEvents.push(event);
    // Keep memory clean, limit to last 1000 events
    if (inMemoryEvents.length > 1000) inMemoryEvents.shift();
    return event;
  }

  static async getEvents(filter = {}) {
    if (this.isConnected()) {
      return await Event.find(filter).sort({ timestamp: -1 });
    }
    
    // Simple in-memory filtering (basic implementation for DAU/WAU/Counts)
    let filtered = [...inMemoryEvents];
    if (filter.eventType) filtered = filtered.filter(e => e.eventType === filter.eventType);
    if (filter.timestamp && filter.timestamp.$gte) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filter.timestamp.$gte));
    }
    return filtered;
  }

  static async getDistinctUserIds(filter = {}) {
    if (this.isConnected()) {
      return await Event.distinct('userId', filter);
    }
    
    const events = await this.getEvents(filter);
    return [...new Set(events.map(e => e.userId))];
  }

  static async aggregateEvents(pipeline) {
    if (this.isConnected()) {
      return await Event.aggregate(pipeline);
    }
    
    // Basic in-memory aggregation support for the most used cases
    // Case 1: Revenue aggregation
    if (JSON.stringify(pipeline).includes('$sum') && JSON.stringify(pipeline).includes('revenue')) {
      const total = inMemoryEvents
        .filter(e => e.eventType === 'purchase' && e.metadata && e.metadata.revenue)
        .reduce((acc, curr) => acc + (Number(curr.metadata.revenue) || 0), 0);
      return [{ _id: null, total }];
    }
    
    // Case 2: Event counts
    if (JSON.stringify(pipeline).includes('$group') && JSON.stringify(pipeline).includes('$eventType')) {
      const counts = {};
      inMemoryEvents.forEach(e => {
        counts[e.eventType] = (counts[e.eventType] || 0) + 1;
      });
      return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
    }

    return [];
  }

  // --- METRIC OPERATIONS ---

  static async saveMetric(metricData) {
    if (this.isConnected()) {
      try {
        return await Metric.findOneAndUpdate(
          { metricName: metricData.metricName, date: metricData.date },
          { value: metricData.value },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('Mongoose saveMetric error:', error.message);
      }
    }
    
    const existingIdx = inMemoryMetrics.findIndex(
      m => m.metricName === metricData.metricName && 
      new Date(m.date).toDateString() === new Date(metricData.date).toDateString()
    );
    
    if (existingIdx > -1) {
      inMemoryMetrics[existingIdx].value = metricData.value;
      return inMemoryMetrics[existingIdx];
    } else {
      const metric = { ...metricData, _id: Date.now().toString() };
      inMemoryMetrics.push(metric);
      return metric;
    }
  }

  static async deleteOldEvents(beforeDate) {
    if (this.isConnected()) {
      return await Event.deleteMany({ timestamp: { $lt: beforeDate } });
    }
    
    const initialCount = inMemoryEvents.length;
    inMemoryEvents = inMemoryEvents.filter(e => new Date(e.timestamp) >= new Date(beforeDate));
    return { deletedCount: initialCount - inMemoryEvents.length };
  }
}

module.exports = StorageService;
