import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import PathSelector from './components/PathSelector/PathSelector';
import SkillTree from './components/SkillTree/SkillTree';
import PracticeSession from './components/Practice/PracticeSession';
import PracticeResult from './components/Practice/PracticeResult';
import PracticeHistory from './components/History/PracticeHistory';
import ConnectionStatus from './components/ConnectionStatus';

function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedPath, setSelectedPath] = useState(null);
  const [practiceNode, setPracticeNode] = useState(null);
  const [practiceResult, setPracticeResult] = useState(null);
  const [treeKey, setTreeKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const handleStartPractice = (node) => {
    setPracticeNode(node);
    setPracticeResult(null);
  };

  const handlePracticeComplete = (result) => {
    setPracticeResult(result);
  };

  const handleClosePractice = () => {
    setPracticeNode(null);
    setPracticeResult(null);
    setTreeKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ConnectionStatus />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">MasteryPath</h1>
            {selectedPath && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{selectedPath.name}</span>
                <button
                  onClick={() => {
                    setSelectedPath(null);
                    setPracticeNode(null);
                    setPracticeResult(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showHistory ? 'Back' : 'History'}
            </button>
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {showHistory ? (
          <PracticeHistory onClose={() => setShowHistory(false)} />
        ) : practiceResult ? (
          <PracticeResult
            result={practiceResult}
            nodeName={practiceNode?.name}
            onClose={handleClosePractice}
          />
        ) : practiceNode ? (
          <PracticeSession
            node={practiceNode}
            onComplete={handlePracticeComplete}
            onCancel={handleClosePractice}
          />
        ) : selectedPath ? (
          <SkillTree
            key={treeKey}
            pathId={selectedPath.id}
            onStartPractice={handleStartPractice}
          />
        ) : (
          <PathSelector onSelectPath={setSelectedPath} />
        )}
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  return user ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
