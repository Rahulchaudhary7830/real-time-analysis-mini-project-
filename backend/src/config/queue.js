const { Queue, Worker } = require('bullmq');
const { REDIS_URL, QUEUE_NAME } = require('./index');
const EventEmitter = require('events');
const redis = require('redis');

const connection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

let eventQueue;
let useRedis = true;

class MockQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  async add(jobName, data) {
    setImmediate(() => this.emit('process', { name: jobName, data }));
    return { id: `mock_${Date.now()}` };
  }
}

const mockQueue = new MockQueue(QUEUE_NAME);

(async () => {
  const client = redis.createClient({ url: REDIS_URL });
  try {
    await client.connect();
    await client.disconnect();
    
    eventQueue = new Queue(QUEUE_NAME, { connection });
    eventQueue.on('error', (err) => {
      useRedis = false;
    });
  } catch (err) {
    useRedis = false;
  }
})();

module.exports = {
  get eventQueue() {
    return useRedis && eventQueue ? eventQueue : mockQueue;
  },
  connection,
  QUEUE_NAME,
  get useRedis() { return useRedis; },
  mockQueue,
};
