import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
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

axios.defaults.timeout = 10000;

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

  const isFetchingRef = useRef(false);
  const fetchTimeoutRef = useRef(null);


  HEAD
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
    //...

    socket.on('connect_error', (err) => {
      console.error('WebSocket Connection Error:', err.message);
    });

    return () => {
      socket.disconnect();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  } [];

  const fetchStats = async () => {
    // Prevent overlapping fetches

  const fetchStats = useCallback(async () => {
 d84bc071428ce28b43ff8413e3bac27850cb1aa1
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const [dau, wau, revenue, counts, funnel] = await Promise.all([
        axios.get(`${API_BASE_URL}/dau`),
        axios.get(`${API_BASE_URL}/wau`),
        axios.get(`${API_BASE_URL}/revenue`),
        axios.get(`${API_BASE_URL}/events/count`),
        axios.get(`${API_BASE_URL}/funnel`)
      ]);

      setStats({
        dau: dau.data?.dau ?? 0,
        wau: wau.data?.wau ?? 0,
        revenue: revenue.data?.totalRevenue ?? 0,
        eventsCount: Array.isArray(counts.data) ? counts.data : [],
        funnel: Array.isArray(funnel.data) ? funnel.data : []
      });
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('new-event', (event) => {
      setLiveEvents((prev) => [event, ...prev].slice(0, 10));

      // debounce
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(fetchStats, 500);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [fetchStats]);


  const handleReset = async () => {
    const confirmReset = window.confirm(
      'Are you sure? This will delete all data.'
    );
    if (!confirmReset) return;

    setLoading(true);

    try {
      await axios.delete(`${API_BASE_URL}/reset`);
      setLiveEvents([]);
      await fetchStats();
      alert('Data reset successful');
    } catch (err) {
      console.error(err);
      alert('Reset failed');
    } finally {
      setLoading(false);
    }
  };


  const chartData = {
    labels: stats.eventsCount.map((e) => e._id),
    datasets: [
      {
        label: 'Event Frequency',
        data: stats.eventsCount.map((e) => e.count),
        backgroundColor: 'rgba(54,162,235,0.5)',
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 1
      }
    ]
  };

  const funnelData = {
    labels: stats.funnel.map((f) => f.step),
    datasets: [
      {
        label: 'Conversion Funnel',
        data: stats.funnel.map((f) => f.count),
        backgroundColor: 'rgba(75,192,192,0.5)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  };

  const totalEvents = stats.eventsCount.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* HEADER */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics Dashboard</h1>
          <p className="text-gray-600">Live monitoring system</p>
        </div>

        <div className="flex gap-3 items-center">
          {loading && <span className="text-blue-500">Syncing...</span>}

          <button onClick={fetchStats} className="btn">
            Refresh
          </button>

          <button onClick={handleReset} className="btn-danger">
            Reset
          </button>
        </div>
      </header>


      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <StatCard title="DAU" value={stats.dau} icon={<Users />} />
        <StatCard title="WAU" value={stats.wau} icon={<Users />} />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={<DollarSign />}
        />
        <StatCard title="Events" value={totalEvents} icon={<Activity />} />
        <StatCard
          title="Event Types"
          value={stats.eventsCount.length}
          icon={<List />}
        />
      </div>


      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Event Distribution">
          <Bar data={chartData} />
        </ChartCard>

        <ChartCard title="Conversion Funnel">
          <Line data={funnelData} />
        </ChartCard>
      </div>


      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="font-semibold mb-4">Live Events</h3>

        <table className="w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Event</th>
              <th>Time</th>
              <th>Device</th>
            </tr>
          </thead>

          <tbody>
            {liveEvents.map((e, i) => (
              <tr key={i}>
                <td>{e.userId}</td>
                <td className="text-blue-600">{e.eventType}</td>
                <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td>{e.device || 'Unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded shadow">
    <div className="flex justify-between mb-2">{icon}</div>
    <h4 className="text-gray-500 text-sm">{title}</h4>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-4 rounded shadow">
    <h3 className="mb-3 font-semibold">{title}</h3>
    {children}
  </div>
);

export default App;
