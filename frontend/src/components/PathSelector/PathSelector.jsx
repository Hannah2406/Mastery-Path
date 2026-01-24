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
    details: '19 concepts across 4 categories',
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading paths...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Choose Your Learning Path
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Select a path to start tracking your mastery
      </p>
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
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {path.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{desc.subtitle}</p>
                  <p className="text-gray-400 text-xs mt-2">{desc.details}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
