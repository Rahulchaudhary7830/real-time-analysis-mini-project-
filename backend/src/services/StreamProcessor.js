const { Transform, Readable, Writable } = require('stream');
const Event = require('../models/Event');

class EventEnricher extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
  }

  _transform(event, encoding, callback) {
    try {
      const enriched = {
        ...event,
        processedAt: new Date().toISOString(),
        enriched: true,
      };
      this.push(enriched);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

class EventSaver extends Writable {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
  }

  async _write(event, encoding, callback) {
    try {
      const newEvent = new Event(event);
      await newEvent.save();
      
      if (global.io) {
        global.io.emit('new-event', event);
      }
      
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

const processBatchWithStreams = (events) => {
  const readable = Readable.from(events);
  const enricher = new EventEnricher();
  const saver = new EventSaver();

  return new Promise((resolve, reject) => {
    readable
      .pipe(enricher)
      .pipe(saver)
      .on('finish', resolve)
      .on('error', reject);
  });
};

module.exports = {
  EventEnricher,
  EventSaver,
  processBatchWithStreams
};
