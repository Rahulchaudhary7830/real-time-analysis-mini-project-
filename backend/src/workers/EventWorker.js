const { Worker } = require('bullmq');
const { connection, QUEUE_NAME, useRedis, mockQueue } = require('../config/queue');
const { processBatchWithStreams } = require('../services/StreamProcessor');

let worker;


const processJob = async (job) => {
  try {
    const { name, data } = job;
    if (name === 'process-event') {
      await processBatchWithStreams([data]);
      console.log(`Processed event via Stream: ${data.eventType} for user: ${data.userId}`);
    }
  } catch (error) {
    console.error('Job processing failed:', error);
  }
};

if (useRedis) {
  try {
    worker = new Worker(QUEUE_NAME, processJob, { connection });
    worker.on('completed', (job) => console.log(`Job ${job.id} completed!`));
    worker.on('failed', (job, err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.log(`Job ${job.id} failed: ${err.message}`);
      }
    });
    worker.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error('BullMQ Worker Error:', err.message);
      }
    });
  } catch (err) {}
}

mockQueue.on('process', processJob);

module.exports = worker;

//eventworking processs analyze the backend working and process