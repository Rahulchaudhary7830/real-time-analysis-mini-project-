const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
  processedAt: { type: Date, default: Date.now },
  device: { type: String },
  ip: { type: String },
  sessionID: { type: String, index: true },
}, { timestamps: true });



EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema, 'events');
