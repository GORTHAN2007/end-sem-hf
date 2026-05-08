import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Line } from 'react-chartjs-2';
import L from 'leaflet';
import { RefreshCw, Users, Activity, MapPin, Navigation } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 30],
  iconAnchor: [25, 15],
  popupAnchor: [0, -15],
});

function calculateSpeed(pos1, pos2, timeDiffSeconds) {
  if (timeDiffSeconds <= 0) return 0;
  const R = 6371; // Earth's radius in km 
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lng - pos1.lng); 
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // distance in km 
  const speedKmh = (distance / timeDiffSeconds) * 3600;
  return speedKmh;
}

export default function ISSTracker({ onDataUpdate }) {
  const [positions, setPositions] = useState([]);
  const [speeds, setSpeeds] = useState([]);
  const [people, setPeople] = useState({ total: 0, names: [] });
  const [nearestPlace, setNearestPlace] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPeople = async () => {
    try {
      const res = await fetch('http://api.open-notify.org/astros.json');
      const data = await res.json();
      setPeople({ total: data.number, names: data.people });
    } catch (err) {
      console.error('Failed to fetch people in space', err);
    }
  };

  const getNearestPlace = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      const data = await res.json();
      if (data.error) {
        setNearestPlace('Ocean / Unmapped area');
      } else {
        setNearestPlace(data.display_name || 'Ocean / Unmapped area');
      }
    } catch (err) {
      setNearestPlace('Ocean / Unmapped area');
    }
  };

  const fetchISSLocation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://api.open-notify.org/iss-now.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      if (data.message !== 'success') throw new Error('API returned an error state');

      const newPos = {
        lat: parseFloat(data.iss_position.latitude),
        lng: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp
      };

      setPositions(prev => {
        // If we have previous positions, calculate speed
        if (prev.length > 0) {
          const lastPos = prev[prev.length - 1];
          const timeDiff = newPos.timestamp - lastPos.timestamp;
          
          if (timeDiff > 0) {
            const currentSpeed = calculateSpeed(
              { lat: lastPos.lat, lng: lastPos.lng },
              { lat: newPos.lat, lng: newPos.lng },
              timeDiff
            );
            
            setSpeeds(prevSpeeds => {
              return [...prevSpeeds, { speed: currentSpeed, time: new Date(newPos.timestamp * 1000).toLocaleTimeString() }].slice(-30);
            });
          } else if (timeDiff === 0) {
            // API returned cached or un-updated timestamp, skip updating state
            return prev;
          }
        }

        // Fetch nearest place only if position changed
        getNearestPlace(newPos.lat, newPos.lng);
        return [...prev, newPos].slice(-15);
      });
      
      setError(null);
    } catch (err) {
      console.warn('ISS Fetch Error:', err);
      // Don't overwrite the last known position, just show a warning
      setError('Failed to fetch ISS location. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
    fetchISSLocation();
    
    const interval = setInterval(fetchISSLocation, 15000);
    return () => clearInterval(interval);
  }, [fetchISSLocation]);

  useEffect(() => {
    if (positions.length > 0) {
      const latest = positions[positions.length - 1];
      const speed = speeds.length > 0 ? speeds[speeds.length - 1].speed : 0;
      onDataUpdate({
        location: { lat: latest.lat, lng: latest.lng },
        speed,
        nearestPlace,
        people: people.names
      });
    }
  }, [positions, speeds, nearestPlace, people, onDataUpdate]);

  const latestPos = positions.length > 0 ? positions[positions.length - 1] : null;
  const currentSpeed = speeds.length > 0 ? speeds[speeds.length - 1].speed : 0;

  const chartData = {
    labels: speeds.map(s => s.time),
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: speeds.map(s => s.speed),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } }
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-blue-500" />
          ISS Live Tracking
        </h2>
        <button 
          onClick={fetchISSLocation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
            {latestPos ? (
              <MapContainer 
                center={[latestPos.lat, latestPos.lng]} 
                zoom={3} 
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <Marker position={[latestPos.lat, latestPos.lng]} icon={issIcon}>
                  <Popup>
                    <strong>ISS Current Location</strong><br/>
                    Lat: {latestPos.lat.toFixed(4)}<br/>
                    Lng: {latestPos.lng.toFixed(4)}
                  </Popup>
                </Marker>
                {positions.length > 1 && (
                  <Polyline 
                    positions={positions.map(p => [p.lat, p.lng])} 
                    color="red" 
                    weight={3} 
                    opacity={0.7} 
                  />
                )}
              </MapContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Navigation size={14}/> Coordinates</div>
              <div className="font-semibold text-sm">
                {latestPos ? `${latestPos.lat.toFixed(4)}, ${latestPos.lng.toFixed(4)}` : '--'}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Activity size={14}/> Speed</div>
              <div className="font-semibold text-sm">
                {currentSpeed ? `${currentSpeed.toFixed(0)} km/h` : 'Calculating...'}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg col-span-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><MapPin size={14}/> Nearest Place</div>
              <div className="font-semibold text-sm truncate" title={nearestPlace}>
                {nearestPlace}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 h-[220px]">
            <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">Speed Trend (Last 30)</h3>
            <div className="h-[150px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* People in space */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex-1">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Users size={16} className="text-purple-500" />
              People in Space ({people.total})
            </h3>
            <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              {people.names.map((person, idx) => (
                <li key={idx} className="text-sm flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
                  <span className="font-medium">{person.name}</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                    {person.craft}
                  </span>
                </li>
              ))}
              {people.names.length === 0 && (
                <li className="text-sm text-gray-500 text-center py-4">Loading astronauts...</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
