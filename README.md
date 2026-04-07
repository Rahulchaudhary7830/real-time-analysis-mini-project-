# Real-Time Analytics Pipeline System

A production-level, scalable analytics system built with Node.js, React, MongoDB, Redis, and BullMQ. This system is designed to handle high volumes of events, process them in real-time using Node.js Streams, and visualize metrics on a live dashboard.

## 🎯 Project Features
- **Event Collection API**: Robust ingestion endpoint (`POST /event`) with request enrichment.
- **Asynchronous Processing**: Uses BullMQ (Redis-backed) for reliable background task management.
- **Real-Time Pipeline**: Implements Node.js `Transform` and `Writable` streams for data enrichment and persistence.
- **Live Dashboard**: React-based UI with real-time updates via WebSockets.
- **Analytics Engine**: Provides pre-computed (Cron) and live metrics with Redis caching.
- **Data Lifecycle**: Automated data archival and cleanup via scheduled cron jobs.

## 🧱 Tech Stack
- **Backend**: Node.js, Express, MongoDB, Mongoose, Redis, BullMQ, Socket.io, Node-cron.
- **Frontend**: React, Vite, Tailwind CSS, Chart.js, Socket.io-client.
- **Security**: Helmet, Express Rate Limit, Input Validation.

## 📁 Architecture
The system uses a decoupled, event-driven architecture:
1. **Ingestion**: API accepts events and pushes them to a Redis queue.
2. **Processing**: Workers consume events from the queue and process them through a Node.js Stream pipeline.
3. **Storage**: Raw events and aggregated metrics are stored in indexed MongoDB collections.
4. **Caching**: Frequently accessed metrics (DAU, Revenue) are cached in Redis.
5. **Real-time**: WebSockets broadcast newly processed events directly to the dashboard.

## 🚀 Setup & Installation (Local)

### 1. Prerequisites
- **Node.js** (Latest LTS)
- **MongoDB Atlas** (Cloud Database)
- **Redis** (running on `127.0.0.1:6379`)

> **Note**: The project is now configured to use **MongoDB Atlas** for database storage. You must **whitelist your current IP address** in the MongoDB Atlas dashboard to allow connections.

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Seed Test Data
To populate the dashboard with sample events:
```bash
cd backend
node src/utils/seed.js
```

## 📊 API Endpoints
- `POST /api/event`: Send a new event (e.g., click, purchase).
- `GET /api/dau`: Get Daily Active Users.
- `GET /api/wau`: Get Weekly Active Users.
- `GET /api/revenue`: Get total revenue from 'purchase' events.
- `GET /api/events/count`: Get frequency distribution of event types.
- `GET /api/funnel`: Get conversion funnel statistics.

## ⚙️ Advanced Implementation Details
- **Streams**: Used in `StreamProcessor.js` to handle data enrichment without blocking the event loop.
- **BullMQ**: Ensures that no event is lost even if the processing worker is busy or restarts.
- **Materialized Views**: The `CronService.js` pre-computes daily statistics to ensure sub-millisecond query response times.
- **Security**: Rate limiting is applied to the ingestion endpoint to prevent DDoS attacks.
