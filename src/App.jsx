import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import ISSTracker from './components/ISSTracker';
import NewsDashboard from './components/NewsDashboard';
import Chatbot from './components/Chatbot';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [dashboardData, setDashboardData] = useState({
    iss: { location: null, speed: 0, nearestPlace: '', people: [] },
    news: { articles: [] }
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  const updateIssData = (data) => {
    setDashboardData(prev => ({ ...prev, iss: { ...prev.iss, ...data } }));
  };

  const updateNewsData = (data) => {
    setDashboardData(prev => ({ ...prev, news: { ...prev.news, ...data } }));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Orbit & Observer
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <main className="container mx-auto p-4 space-y-8">
        <ISSTracker onDataUpdate={updateIssData} />
        <NewsDashboard onDataUpdate={updateNewsData} />
      </main>

      <Chatbot dashboardData={dashboardData} />
    </div>
  );
}

export default App;
