const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT, CORS_ORIGIN } = require('./config/index');
require('./workers/EventWorker');
require('./services/CronService');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log('New dashboard client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Dashboard client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try another port or kill the existing process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = { server, io };
