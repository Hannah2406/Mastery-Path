import { useEffect, useState } from 'react';
import { getHeatmap } from '../../api/history';

const CELL_SIZE = 12;
const GAP = 3;

// Format date as YYYY-MM-DD in local time (matches backend ISO_LOCAL_DATE)
function formatDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today as YYYY-MM-DD for consistent comparison
function getTodayStr() {
  const today = new Date();
  return formatDateStr(today);
}

function generateCalendarSquares(contributions) {
  const squares = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start from the Sunday of the week that contains (today - 54*7)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 54 * 7);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  // Generate days until we include today (full weeks so grid is 7 rows)
  const currentDate = new Date(startDate);
  const todayStr = formatDateStr(today);
  const maxDays = 55 * 7; // safety cap so we never hang
  for (let i = 0; i < maxDays; i++) {
    const dateStr = formatDateStr(currentDate);
    const count = contributions[dateStr] ?? 0;
    squares.push({ date: dateStr, count });
    if (dateStr === todayStr) break;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  // Pad to a full number of weeks (7 rows)
  const remainder = squares.length % 7;
  if (remainder !== 0) {
    const pad = 7 - remainder;
    const [y, m, d] = squares[squares.length - 1].date.split('-').map(Number);
    const lastDate = new Date(y, m - 1, d);
    for (let i = 0; i < pad; i++) {
      lastDate.setDate(lastDate.getDate() + 1);
      squares.push({ date: formatDateStr(lastDate), count: 0 });
    }
  }
  return squares;
}

function getMonthLabels(squares) {
  if (squares.length === 0) return [];
  const months = [];
  const squareWidth = CELL_SIZE + GAP;
  let lastMonth = '';
  let monthStartIndex = 0;
  for (let i = 0; i < squares.length; i += 7) {
    const weekSquares = squares.slice(i, i + 7);
    const firstDay = new Date(weekSquares[0].date);
    const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const dayOfMonth = firstDay.getDate();
    if (month !== lastMonth && dayOfMonth <= 7) {
      if (lastMonth) {
        months.push({ label: lastMonth, width: (i - monthStartIndex) * squareWidth });
      }
      lastMonth = month;
      monthStartIndex = i;
    }
  }
  if (lastMonth) {
    months.push({ label: lastMonth, width: (squares.length - monthStartIndex) * squareWidth });
  }
  return months;
}

function isTodayDate(dateStr) {
  return dateStr === getTodayStr();
}

// Green scale for practice count (direct hex; coerce to number for API string values)
function getColor(count) {
  const n = Number(count) || 0;
  if (n === 0) return '#334155';   // slate (no practice)
  if (n === 1) return '#22c55e';   // green-500
  if (n === 2) return '#16a34a';   // green-600
  if (n === 3) return '#15803d';   // green-700
  return '#14532d';                // green-800 (4+)
}

export default function ContributionHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHeatmap()
      .then(setHeatmapData)
      .catch((err) => setError(err.message || 'Failed to load heatmap data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4 animate-pulse mx-auto" />
          <div className="text-slate-400 font-medium">Loading heatmap...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl max-w-md mx-auto">
          <div className="font-bold mb-2">Connection error</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="text-center p-8 text-slate-400">
        <p className="font-medium">No data available</p>
        <p className="text-xs text-slate-500 mt-2">Start practicing to see your activity!</p>
      </div>
    );
  }

  const contributions = heatmapData.contributions || {};
  const squares = generateCalendarSquares(contributions);
  const monthLabels = getMonthLabels(squares);

  return (
    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">Practice Activity</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 text-center">
          <div className="text-sm font-semibold text-slate-400 mb-1">Total Practices</div>
          <div className="text-2xl font-bold text-white">{heatmapData.totalPractices || 0}</div>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-xl border border-emerald-500/30 text-center">
          <div className="text-sm font-semibold text-slate-400 mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-emerald-400">{heatmapData.currentStreak || 0} 🔥</div>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 text-center">
          <div className="text-sm font-semibold text-slate-400 mb-1">Best Streak</div>
          <div className="text-2xl font-bold text-indigo-400">{heatmapData.longestStreak || 0} ⭐</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-6 text-xs font-medium text-slate-400 shrink-0">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="h-[15px] flex items-center justify-center" style={{ width: 14 }}>{d}</span>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {monthLabels.map((m, idx) => (
                  <div key={idx} className="text-xs text-slate-500 font-medium shrink-0" style={{ width: m.width }}>
                    {m.label}
                  </div>
                ))}
              </div>
              <div
                className="grid gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${Math.ceil(squares.length / 7)}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                  gridAutoFlow: 'column',
                }}
              >
                {squares.map((square, idx) => {
                  const isToday = isTodayDate(square.date);
                  const color = getColor(square.count);
                  return (
                    <div
                      key={idx}
                      className="rounded-[2px] cursor-pointer shrink-0 transition-transform hover:scale-125 hover:z-10 relative flex-shrink-0"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        minWidth: CELL_SIZE,
                        minHeight: CELL_SIZE,
                        backgroundColor: color,
                        outline: isToday ? '2px solid rgb(99 102 241)' : 'none',
                        outlineOffset: 1,
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={() => setHoveredDay(square)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${square.date}: ${square.count} practice(s)${isToday ? ' (today)' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hoveredDay && (
        <div className="mt-2 text-center text-sm text-slate-400">
          <span className="font-medium text-white">{hoveredDay.count} practice{hoveredDay.count !== 1 ? 's' : ''}</span>
          {' on '}
          <span>{hoveredDay.date}</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-700">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="rounded-[2px] border border-slate-600 flex-shrink-0"
              style={{ width: 14, height: 14, backgroundColor: getColor(level) }}
              title={level === 0 ? 'No practice' : `${level} practice(s)`}
            />
          ))}
        </div>
        <span>More</span>
        <span className="ml-2 text-slate-500">Today: {getTodayStr()}</span>
      </div>
    </div>
  );
}
