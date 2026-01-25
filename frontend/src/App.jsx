import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import PathSelector from './components/PathSelector/PathSelector';
import SkillTree from './components/SkillTree/SkillTree';
import PracticeSession from './components/Practice/PracticeSession';
import PracticeResult from './components/Practice/PracticeResult';
import PracticeHistory from './components/History/PracticeHistory';
import ProfileModal from './components/Profile/ProfileModal';
import ConnectionStatus from './components/ConnectionStatus';

function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedPath, setSelectedPath] = useState(null);
  const [practiceNode, setPracticeNode] = useState(null);
  const [practiceResult, setPracticeResult] = useState(null);
  const [treeKey, setTreeKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <ConnectionStatus />
      <header className="glass-effect border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📚</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MasteryPath
              </h1>
            </div>
            {selectedPath && (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <span className="text-gray-500 font-medium">{selectedPath.name}</span>
                <button
                  onClick={() => {
                    setSelectedPath(null);
                    setPracticeNode(null);
                    setPracticeResult(null);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Change Path
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {showHistory ? '← Back' : '📊 History'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors border border-gray-200 hover:border-indigo-300"
            >
              👤 {user.email}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
            <span className="text-3xl">📚</span>
          </div>
          <div className="text-gray-600 font-medium">Loading...</div>
        </div>
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
