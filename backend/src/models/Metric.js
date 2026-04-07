const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  metricName: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true, index: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

MetricSchema.index({ metricName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Metric', MetricSchema);
