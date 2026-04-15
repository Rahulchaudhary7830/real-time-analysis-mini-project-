import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Activity, Users, DollarSign, List } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

const BACKEND_HOST = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${BACKEND_HOST}:5000/api`;
const SOCKET_URL = `http://${BACKEND_HOST}:5000`;

// Configure global axios defaults
axios.defaults.timeout = 10000; // 10s timeout

function App() {
  const [stats, setStats] = useState({
    dau: 0,
    wau: 0,
    revenue: 0,
    eventsCount: [],
    funnel: []
  });
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use a ref to track if a fetch is already in progress
  const isFetchingRef = useRef(false);
  // Ref for debounce timer
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchStats();
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('new-event', (event) => {
      console.log('Real-time event received:', event);
      setLiveEvents(prev => [event, ...prev].slice(0, 10));
      
      // Debounce fetchStats to avoid spamming during high event volume
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchStats();
      }, 500); // Wait for 500ms of inactivity before fetching again
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket Connection Error:', err.message);
    });

    return () => {
      socket.disconnect();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  const fetchStats = async () => {
    // Prevent overlapping fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      console.log('Attempting to fetch stats from:', API_BASE_URL);
      
      const [dauRes, wauRes, revenueRes, countsRes, funnelRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dau`),
        axios.get(`${API_BASE_URL}/wau`),
        axios.get(`${API_BASE_URL}/revenue`),
        axios.get(`${API_BASE_URL}/events/count`),
        axios.get(`${API_BASE_URL}/funnel`)
      ]);

      setStats({
        dau: dauRes.data.dau || 0,
        wau: wauRes.data.wau || 0,
        revenue: revenueRes.data.totalRevenue || 0,
        eventsCount: Array.isArray(countsRes.data) ? countsRes.data : [],
        funnel: Array.isArray(funnelRes.data) ? funnelRes.data : []
      });
    } catch (error) {
      console.error('Fetch error:', error.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This will delete all events and metrics.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/reset`);
      setLiveEvents([]);
      await fetchStats();
      alert('All data has been reset successfully.');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please check the console for errors.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: stats.eventsCount.map(item => item._id),
    datasets: [{
      label: 'Event Frequency',
      data: stats.eventsCount.map(item => item.count),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };

  const funnelData = {
    labels: stats.funnel.map(item => item.step),
    datasets: [{
      label: 'Conversion Funnel',
      data: stats.funnel.map(item => item.count),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }]
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Real-Time Analytics Dashboard</h1>
          <p className="text-gray-600">Monitoring user interactions and performance in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          {loading && <span className="text-sm text-blue-500 animate-pulse">Syncing...</span>}
          <button 
            onClick={fetchStats}
            className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Refresh Data
          </button>
          <button 
            onClick={handleReset}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-sm border border-red-200 hover:bg-red-100 text-sm font-medium transition-colors"
          >
            Reset Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-500" />
            <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-1 rounded">Live</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Daily Active Users</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.dau}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-indigo-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">Weekly Active Users</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.wau}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-green-500" />
            <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded">MTD</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-800">${stats.revenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-purple-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">Events Processed</h3>
          <p className="text-2xl font-bold text-gray-800">
            {stats.eventsCount.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <List className="text-orange-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">Event Types</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.eventsCount.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Event Distribution</h3>
          <Bar data={chartData} options={{ responsive: true }} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <Line data={funnelData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Live Event Feed</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {liveEvents.map((event, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm text-gray-600">{event.userId}</td>
                  <td className="px-4 py-2 text-sm font-medium text-blue-600">{event.eventType}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{event.device || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
