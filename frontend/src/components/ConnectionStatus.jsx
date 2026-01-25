import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/v1/health', {
          credentials: 'include',
        });
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (checking || isConnected) {
    return null;
  }

  return (
    <div className="mx-6 mt-4 mb-4">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-5 animate-fade-in">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-base font-bold text-red-800 mb-2">
              Cannot connect to backend server
            </p>
            <p className="text-sm text-red-700 mb-3">
              Please make sure:
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              <li className="flex items-center">
                <span className="mr-2">•</span>
                The backend is running on port 8080
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                The database is running (docker compose up -d)
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Check the backend terminal for errors
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
