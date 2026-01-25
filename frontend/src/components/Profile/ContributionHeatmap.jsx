import { useEffect, useState } from 'react';
import { getHeatmap } from '../../api/history';

export default function ContributionHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    getHeatmap()
      .then(setHeatmapData)
      .catch((err) => {
        console.error('Heatmap fetch error:', err);
        setError(err.message || 'Failed to load heatmap data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-4 shadow-lg animate-pulse">
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-gray-600 font-medium">Loading heatmap...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 font-bold mb-2">⚠️ Connection Error</div>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Frontend:</strong> http://localhost:5173</p>
            <p><strong>Backend API:</strong> http://localhost:8080/api/v1</p>
            <p className="mt-2 text-gray-500">Make sure both servers are running</p>
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="text-center p-8 text-gray-600">
        <p className="font-medium">No data available</p>
        <p className="text-xs text-gray-500 mt-2">Start practicing to see your activity!</p>
      </div>
    );
  }

  const contributions = heatmapData.contributions || {};
  const squares = generateCalendarSquares(contributions);
  const maxCount = Math.max(...Object.values(contributions), 1);

  const getColor = (count) => {
    if (count === 0) return '#ebedf0';
    // Use count directly for color intensity
    if (count === 1) return '#9be9a8';
    if (count === 2) return '#40c463';
    if (count === 3) return '#30a14e';
    if (count >= 4) return '#216e39';
    return '#9be9a8';
  };
  

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Practice Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="text-sm font-semibold text-gray-600 mb-1">Total Practices</div>
            <div className="text-3xl font-bold text-indigo-600">{heatmapData.totalPractices || 0}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="text-sm font-semibold text-gray-600 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-green-600">{heatmapData.currentStreak || 0} 🔥</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="text-sm font-semibold text-gray-600 mb-1">Best Streak</div>
            <div className="text-3xl font-bold text-purple-600">{heatmapData.longestStreak || 0} ⭐</div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-6 overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col gap-1.5 pt-8 text-xs font-semibold text-gray-600 flex-shrink-0">
          <span className="h-4 flex items-center">S</span>
          <span className="h-4 flex items-center">M</span>
          <span className="h-4 flex items-center">T</span>
          <span className="h-4 flex items-center">W</span>
          <span className="h-4 flex items-center">T</span>
          <span className="h-4 flex items-center">F</span>
          <span className="h-4 flex items-center">S</span>
        </div>

        {/* Calendar grid with month labels */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            {/* Month labels row */}
            <div className="flex mb-2" style={{ marginLeft: '0px' }}>
              {getMonthLabels(squares).map((month, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-600 font-semibold flex-shrink-0"
                  style={{ width: `${month.width}px`, textAlign: 'left', paddingLeft: '4px' }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            
            {/* Calendar grid - GitHub style */}
            <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
              {squares.map((square, idx) => {
                const hasPractice = square.count > 0;
                const isToday = isTodayDate(square.date);
                const color = getColor(square.count);
                
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-sm cursor-pointer relative group transition-all hover:scale-125 hover:z-10 ${
                      isToday ? 'ring-1 ring-indigo-500' : ''
                    }`}
                    style={{ 
                      backgroundColor: color,
                      border: isToday ? '1px solid rgba(99, 102, 241, 0.5)' : 'none'
                    }}
                    onMouseEnter={() => setHoveredDay(square)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={`${formatDate(square.date)}: ${square.count} ${square.count === 1 ? 'practice' : 'practices'}`}
                  >
                    {hoveredDay?.date === square.date && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-xl whitespace-nowrap z-30">
                        <div className="font-bold mb-1">
                          {square.count} {square.count === 1 ? 'practice' : 'practices'}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          {formatDate(square.date)}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mt-6 pt-6 border-t border-gray-200">
        <span className="font-semibold">Less</span>
        <div className="flex gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#ebedf0' }} title="No practice"></div>
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#9be9a8' }} title="1 practice"></div>
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#40c463' }} title="2 practices"></div>
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#30a14e' }} title="3 practices"></div>
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#216e39' }} title="4+ practices"></div>
        </div>
        <span className="font-semibold">More</span>
      </div>
    </div>
  );
}

function generateCalendarSquares(contributions) {
  const squares = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Go back 371 days (53 weeks + a few days to ensure we have full weeks)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 371);
  
  // Find the Sunday of that week
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Helper to format date consistently (YYYY-MM-DD) using local timezone
  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Normalize contributions - ensure all keys are YYYY-MM-DD format
  const normalizedContributions = {};
  for (const [key, value] of Object.entries(contributions)) {
    // Try parsing as date first
    const date = new Date(key);
    if (!isNaN(date.getTime())) {
      const normalizedKey = formatDateStr(date);
      normalizedContributions[normalizedKey] = (normalizedContributions[normalizedKey] || 0) + value;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      // Already in correct format
      normalizedContributions[key] = (normalizedContributions[key] || 0) + value;
    }
  }
  
  // Debug: log normalized contributions
  console.log('Normalized contributions:', normalizedContributions);
  
  // Generate 53 weeks * 7 days = 371 squares
  const currentDate = new Date(startDate);
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      // Use local date formatting to avoid timezone issues
      const dateStr = formatDateStr(currentDate);
      const count = normalizedContributions[dateStr] || 0;
      
      // Debug: log Jan 23 specifically
      if (dateStr === '2026-01-23') {
        console.log('Jan 23 square generated:', { dateStr, count, hasInContributions: dateStr in normalizedContributions });
      }
      
      squares.push({
        date: dateStr,
        count: count
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return squares;
}

function getMonthLabels(squares) {
  if (squares.length === 0) return [];
  
  const months = [];
  const squareWidth = 18.5; // 16px width + 2.5px gap
  let lastMonth = '';
  let monthStartIndex = 0;
  
  // Group squares by week (every 7 squares)
  for (let i = 0; i < squares.length; i += 7) {
    const weekSquares = squares.slice(i, i + 7);
    const firstDay = new Date(weekSquares[0].date);
    const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const dayOfMonth = firstDay.getDate();
    
    // If this is a new month (and it's early in the month), add a label
    if (month !== lastMonth && dayOfMonth <= 7) {
      if (lastMonth) {
        // Calculate width for previous month
        const width = (i - monthStartIndex) * squareWidth;
        months.push({ label: lastMonth, width: width });
      }
      lastMonth = month;
      monthStartIndex = i;
    }
  }
  
  // Add the last month
  if (lastMonth) {
    const width = (squares.length - monthStartIndex) * squareWidth;
    months.push({ label: lastMonth, width: width });
  }
  
  return months;
}

function isTodayDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}
