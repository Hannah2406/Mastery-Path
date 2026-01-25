import { useState, useEffect } from 'react';
import { getPaths } from '../../api/paths';

const pathIcons = {
  'Blind 75': '💻',
  'AMC8': '🔢',
};

const pathDescriptions = {
  'Blind 75': {
    subtitle: 'Coding Interview Prep',
    details: '27 essential problems across 12 categories',
  },
  'AMC8': {
    subtitle: 'Competition Math',
    details: '59 concepts across 4 categories',
  },
};

export default function PathSelector({ onSelectPath }) {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPaths()
      .then(setPaths)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-4 shadow-lg animate-pulse">
            <span className="text-2xl">📚</span>
          </div>
          <div className="text-gray-600 font-medium">Loading paths...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-sm max-w-md">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-3">
          Choose Your Learning Path
        </h2>
        <p className="text-lg text-gray-600">
          Select a path to start tracking your mastery journey
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((path) => {
          const icon = pathIcons[path.name] || '📚';
          const desc = pathDescriptions[path.name] || {
            subtitle: path.description,
            details: '',
          };
          return (
            <button
              key={path.id}
              onClick={() => onSelectPath(path)}
              className="group glass-effect p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left border-2 border-transparent hover:border-indigo-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {path.name}
                  </h3>
                  <p className="text-gray-600 font-medium mb-2">{desc.subtitle}</p>
                  <p className="text-gray-500 text-sm">{desc.details}</p>
                  <div className="mt-4 flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Start learning →
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
