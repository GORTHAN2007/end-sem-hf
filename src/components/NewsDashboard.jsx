import { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Search, RefreshCw, Calendar, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES = ['articles', 'blogs'];
const CACHE_DURATION = 15 * 60 * 1000; // 15 mins

export default function NewsDashboard({ onDataUpdate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);

  const fetchCategoryNews = async (category, forceRefresh = false) => {
    const cacheKey = `news_${category}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!forceRefresh && cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.data.map(a => ({ ...a, category }));
      }
    }

    try {
      // Spaceflight News API (100% Free, No API Key needed, fits ISS theme perfectly)
      let url = `https://api.spaceflightnewsapi.net/v4/${category}/?limit=5`;
      if (forceRefresh) {
        // Fetch a random offset so the user visibly sees new articles upon refreshing
        const randomOffset = Math.floor(Math.random() * 20);
        url += `&offset=${randomOffset}&t=${Date.now()}`;
      }
      
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error('API Error');
      }

      // Map to standard format
      const validArticles = data.results.map(a => ({
        title: a.title,
        url: a.url,
        urlToImage: a.image_url,
        description: a.summary,
        source: { name: a.news_site },
        publishedAt: a.published_at,
        category: category
      }));
      
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: validArticles
      }));

      return validArticles;
    } catch (err) {
      console.error(`Error fetching ${category} news:`, err);
      // fallback dummy data if API fails
      return Array.from({length: 5}).map((_, i) => ({
        title: `Fallback ${category} item ${i+1}`,
        source: { name: 'Fallback Source' },
        author: 'John Doe',
        publishedAt: new Date().toISOString(),
        urlToImage: 'https://via.placeholder.com/150',
        description: 'This is a fallback description due to API limits or errors.',
        url: '#',
        category
      }));
    }
  };

  const loadAllNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(CATEGORIES.map(c => fetchCategoryNews(c, forceRefresh)));
      const allNews = results.flat();
      setArticles(allNews);
    } catch (err) {
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCategory = async (category) => {
    setLoading(true);
    const updated = await fetchCategoryNews(category, true);
    setArticles(prev => [
      ...prev.filter(a => a.category !== category),
      ...updated
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllNews();
  }, []);

  useEffect(() => {
    onDataUpdate({ articles });
  }, [articles, onDataUpdate]);

  // Chart data
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = articles.filter(a => a.category === cat).length;
    return acc;
  }, {});

  const chartData = {
    labels: CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [{
      data: CATEGORIES.map(c => categoryCounts[c] || 0),
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const cat = CATEGORIES[index];
        setSelectedCategoryFilter(prev => prev === cat ? null : cat);
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: 'var(--color-text)' } }
    }
  };

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let result = [...articles];
    if (selectedCategoryFilter) {
      result = result.filter(a => a.category === selectedCategoryFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.title?.toLowerCase().includes(lower) || 
        a.description?.toLowerCase().includes(lower) ||
        a.source?.name?.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      } else {
        const nameA = a.source?.name || '';
        const nameB = b.source?.name || '';
        return nameA.localeCompare(nameB);
      }
    });

    return result;
  }, [articles, searchTerm, sortBy, selectedCategoryFilter]);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="text-green-500" />
          Latest News
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search articles..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
            >
              <option value="date">Sort by Date</option>
              <option value="source">Sort by Source</option>
            </select>
          </div>
          
          <button 
            onClick={() => loadAllNews(true)}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Refresh All"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-4 text-gray-600 dark:text-gray-300 text-center">
              News Distribution<br/>
              <span className="text-xs font-normal text-gray-500">(Click slice to filter)</span>
            </h3>
            <div className="h-[200px] w-full">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            {selectedCategoryFilter && (
              <button 
                onClick={() => setSelectedCategoryFilter(null)}
                className="mt-4 text-xs text-blue-500 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => handleRefreshCategory(cat)}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm"
              >
                <span className="capitalize">{cat}</span>
                <RefreshCw size={14} className={loading ? 'animate-spin text-gray-400' : 'text-gray-400'} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 h-64 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredAndSorted.length > 0 ? filteredAndSorted.map((article) => (
                <div key={article.url + article.publishedAt} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group min-h-[350px]">
                  {article.urlToImage ? (
                    <div className="h-40 w-full shrink-0 overflow-hidden relative bg-gray-100 dark:bg-gray-700">
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10 backdrop-blur-sm capitalize">
                        {article.category}
                      </div>
                      <img 
                        src={article.urlToImage} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('flex', 'items-center', 'justify-center'); e.target.parentElement.innerHTML += '<span class="text-gray-400">Image Failed</span>'; }}
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10 backdrop-blur-sm capitalize">
                        {article.category}
                      </div>
                      <Calendar size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                          {article.source?.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(article.publishedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {article.description || 'No description available for this article.'}
                      </p>
                    </div>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mt-2"
                    >
                      Read More <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )) : (
                <div className="col-span-full flex flex-col items-center justify-center h-40 text-gray-500">
                  <Search size={32} className="mb-2 opacity-50" />
                  <p>No articles found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
