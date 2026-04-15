# Nexus Analytics Pipeline: Comprehensive Project Documentation

This document provides a detailed walkthrough of the **Real-Time Analytics Pipeline** project, covering every file, module, and architectural decision made from start to finish.

---

## **1. Project Vision**
The goal was to build a production-grade, scalable analytics system that can ingest high volumes of user events (clicks, views, purchases) from a source website, process them asynchronously to ensure performance, and visualize metrics in real-time on a dashboard.

---

## **2. Architecture Overview**
The system uses a **Decoupled Event-Driven Architecture**:
1.  **Source (Demo Website)**: Generates raw events.
2.  **Ingestion (Express API)**: Receives events and queues them.
3.  **Buffer (Redis/BullMQ)**: Holds events to prevent database overloading.
4.  **Processor (Node.js Streams)**: Enriches and saves data efficiently.
5.  **Storage (MongoDB Atlas)**: Persistent storage for analytics.
6.  **Visualization (React Dashboard)**: Real-time charts and live feed.

---

## **3. Backend Breakdown (`/backend`)**

### **Core Configuration**
- **`src/server.js`**: The entry point. It initializes the Express app and sets up **Socket.io**. It is responsible for starting the HTTP server and establishing the real-time communication bridge to the frontend.
- **`src/app.js`**: Configures Express middleware (CORS, JSON parsing, Morgan logging) and connects to **MongoDB Atlas**. It ensures the environment is secure and ready to handle requests.
- **`src/config/index.js`**: Centralizes environment variables (MongoDB URI, Redis URL, Port). This makes the app configurable without changing code.
- **`src/config/queue.js`**: Sets up **BullMQ**. It includes a "Mock Queue" fallback logic, ensuring the backend stays alive even if Redis is temporarily unavailable.

### **Data Models**
- **`src/models/Event.js`**: Defines the schema for a raw event. Stores `userId`, `eventType`, `timestamp`, and dynamic `metadata`. It uses indexes on `userId` and `timestamp` for fast analytics.
- **`src/models/Metric.js`**: Defines "Materialized Views"—pre-computed daily summaries (e.g., total revenue for April 8th). This prevents expensive recalculations every time the dashboard loads.

### **Controllers & Logic**
- **`src/controllers/EventController.js`**: The "Gatekeeper". It receives the POST request from the demo site, enriches it with the user's IP and User-Agent, and pushes it into the Redis queue. It returns a `202 Accepted` status immediately, making the ingestion lightning-fast.
- **`src/controllers/AnalyticsController.js`**: The "Brains". Contains the logic for:
    - `getDAU / getWAU`: Calculates unique active users while strictly excluding `guest_` IDs to ensure accurate business metrics.
    - `getRevenue`: Aggregates total sales using MongoDB's `$toDouble` for precision.
    - `getFunnel`: Tracks the user journey (View -> Click -> Purchase).
    - `resetData`: A maintenance function that wipes the DB and Redis cache for testing.

### **Processing Pipeline**
- **`src/workers/EventWorker.js`**: A background process that listens to the Redis queue. When an event arrives, it passes it to the `StreamProcessor`.
- **`src/services/StreamProcessor.js`**: Uses high-performance **Node.js Streams**. It pipes data through a `Transform` stream (for final enrichment) into a `Writable` stream (which saves to MongoDB and broadcasts via Socket.io). This is much faster than standard loops.
- **`src/services/CronService.js`**: Scheduled tasks that run every midnight to pre-compute the previous day's metrics and archive old data, keeping the database lean.

---

## **4. Frontend Breakdown (`/frontend`)**

- **`src/main.jsx`**: Initializes the React application.
- **`src/App.jsx`**: The main dashboard component. 
    - **State Management**: Uses `useState` and `useRef` to manage metrics and prevent "API spamming" (debouncing).
    - **Real-Time Feed**: Listens for `new-event` from the backend and updates the live scrolling list.
    - **Visualization**: Uses **Chart.js** to render the Event Distribution (Bar Chart) and Conversion Funnel (Pie Chart).
    - **Resilience**: Implements a locking mechanism so overlapping API calls don't crash the browser.

---

## **5. Demo Website (`/demo-site`)**

- **`index.html`**: A "Premium Store" simulation.
    - **Identity System**: Assigns `guest_` IDs initially. Upon login, it switches to a unique `user_` ID.
    - **Event Triggers**: Every interaction (filtering categories, adding to bag, subscribing) is hooked into a `trackEvent()` function that hits our Backend API.
    - **Visuals**: Uses Tailwind CSS and DiceBear Avatars to create a realistic, immersive testing environment.
- **`run-demo-site.js`**: A lightweight Node.js script that serves the demo website on port 8000.

---

## **6. Key Libraries Used & Why**

| Library | Purpose |
| :--- | :--- |
| **Express** | Fast, unopinionated web framework for the API layer. |
| **Mongoose** | Elegant MongoDB object modeling for Node.js. |
| **Redis** | High-speed in-memory data store for caching and queuing. |
| **BullMQ** | Reliable message queue for asynchronous background processing. |
| **Socket.io** | Enables bi-directional, real-time communication between server and client. |
| **Node.js Streams** | Handles large volumes of data with minimal memory footprint. |
| **Chart.js** | Flexible, easy-to-use library for data visualization. |
| **Tailwind CSS** | Utility-first CSS framework for rapid, modern UI development. |

---

## **7. Project Evolution (The "Story")**
1.  **Phase 1**: We established the basic API and database connection.
2.  **Phase 2**: We implemented the **Redis Queue** to handle high traffic without crashing.
3.  **Phase 3**: We built the **React Dashboard** to see the data visually.
4.  **Phase 4**: We created the **Premium Demo Store** to generate realistic data.
5.  **Phase 5 (Fixes)**: We resolved critical bugs like "Rapid Re-fetching" (which was crashing the browser) and fixed the "Double Counting" of active users by introducing strict Guest vs. User logic.
6.  **Phase 6 (Cleanup)**: We removed all unnecessary debugging logs and helper files to leave a clean, efficient codebase.

---
**Status**: Completed & Verified.
**Architecture**: Event-Driven, Scalable, Real-Time.
