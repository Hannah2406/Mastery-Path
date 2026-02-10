import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/v1/health', { credentials: 'include' });
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  if (checking || isConnected) return null;

  return (
    <div className="mx-4 mt-3 mb-2">
      <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 animate-fade-in">
        <p className="text-red-200 font-medium mb-1">Cannot connect to backend server</p>
        <p className="text-sm text-red-300/90">Start the backend: <code className="bg-slate-800 px-1 rounded">cd backend && mvn spring-boot:run</code></p>
      </div>
    </div>
  );
}
