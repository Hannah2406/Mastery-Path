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
      <div className="bg-[#FEE2E2] border border-[#EF4444]/30 rounded-xl p-4 animate-fade-in shadow-sm">
        {!backendOk ? (
          <>
            <p className="text-[#B91C1C] font-medium mb-1">Cannot connect to backend</p>
            <p className="text-sm text-[#991B1B]">From the project folder run: <code className="bg-[#FFFFFF] border border-[#E9E7F5] px-2 py-0.5 rounded-lg text-[#1F2937]">./start-all.sh</code> (starts database + backend + frontend)</p>
          </>
        ) : !databaseOk ? (
          <>
            <p className="text-[#B91C1C] font-medium mb-1">Database not connected</p>
            <p className="text-sm text-[#991B1B] mb-2">Login will not work until the database is running. From the project folder run: <code className="bg-[#FFFFFF] border border-[#E9E7F5] px-2 py-0.5 rounded-lg text-[#1F2937]">./start-all.sh</code></p>
            <p className="text-sm text-[#991B1B]">Or start only the DB: <code className="bg-[#FFFFFF] border border-[#E9E7F5] px-2 py-0.5 rounded-lg text-[#1F2937]">docker compose up -d</code> then restart the backend (no <code>-Dspring-boot.run.profiles=h2</code>).</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
