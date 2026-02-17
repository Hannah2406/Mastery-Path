import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const [backendOk, setBackendOk] = useState(true);
  const [databaseOk, setDatabaseOk] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/v1/health', { credentials: 'include' });
        const data = response.ok ? await response.json() : null;
        setBackendOk(response.ok);
        setDatabaseOk(data?.database === 'connected');
      } catch (error) {
        setBackendOk(false);
        setDatabaseOk(false);
      } finally {
        setChecking(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  if (checking) return null;
  if (backendOk && databaseOk) return null;

  return (
    <div className="mx-4 mt-3 mb-2">
      <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 animate-fade-in">
        {!backendOk ? (
          <>
            <p className="text-red-200 font-medium mb-1">Cannot connect to backend</p>
            <p className="text-sm text-red-300/90">From the project folder run: <code className="bg-slate-800 px-1 rounded">./start-all.sh</code> (starts database + backend + frontend)</p>
          </>
        ) : !databaseOk ? (
          <>
            <p className="text-red-200 font-medium mb-1">Database not connected</p>
            <p className="text-sm text-red-300/90 mb-2">Login will not work until the database is running. From the project folder run: <code className="bg-slate-800 px-1 rounded">./start-all.sh</code></p>
            <p className="text-sm text-red-300/80">Or start only the DB: <code className="bg-slate-800 px-1 rounded">docker compose up -d</code> then restart the backend (no <code>-Dspring-boot.run.profiles=h2</code>).</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
