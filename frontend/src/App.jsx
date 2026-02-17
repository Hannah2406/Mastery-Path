import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import PathSelector from './components/PathSelector/PathSelector';
import SkillTree from './components/SkillTree/SkillTree';
import PracticeSession from './components/Practice/PracticeSession';
import PracticeResult from './components/Practice/PracticeResult';
import PracticeErrorBoundary from './components/Practice/PracticeErrorBoundary';
import PracticeHistory from './components/History/PracticeHistory';
import ProfileModal from './components/Profile/ProfileModal';
import ConnectionStatus from './components/ConnectionStatus';
import ReviewQueue from './components/Review/ReviewQueue';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import MarketplaceBrowser from './components/Marketplace/MarketplaceBrowser';
import PublishToMarketplaceModal from './components/Marketplace/PublishToMarketplaceModal';
import { getHeatmap } from './api/history';
import { getPathStats } from './api/paths';

const TABS = { map: 'Map', review: 'Review', analytics: 'Analytics' };

function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedPath, setSelectedPath] = useState(null);
  const [practiceNode, setPracticeNode] = useState(null);
  const [practiceResult, setPracticeResult] = useState(null);
  const [lastErrorType, setLastErrorType] = useState(null);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [treeKey, setTreeKey] = useState(0);
  const [activeTab, setActiveTab] = useState('map');
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pathStats, setPathStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showPublishMarketplace, setShowPublishMarketplace] = useState(false);

  useEffect(() => {
    if (!selectedPath?.id) {
      setPathStats(null);
      return;
    }
    getPathStats(selectedPath.id)
      .then(setPathStats)
      .catch(() => setPathStats(null));
  }, [selectedPath?.id, treeKey]);

  useEffect(() => {
    getHeatmap().then(setHeatmapData).catch(() => setHeatmapData(null));
  }, [treeKey]);

  const handleStartPractice = (node) => {
    // Normalize: tree may pass API node or React Flow node (payload in .data)
    const payload = node?.data ?? node;
    if (!payload) {
      setPracticeNode(node);
      setPracticeResult(null);
      return;
    }
    const numId = payload.id != null ? Number(payload.id) : undefined;
    const normalized = {
      id: numId != null && !Number.isNaN(numId) ? numId : undefined,
      name: payload.name ?? 'Practice',
      category: payload.category ?? '',
      description: payload.description ?? '',
      status: payload.status,
      externalUrl: payload.externalUrl,
      masteryScore: payload.masteryScore,
    };
    setPracticeNode(normalized);
    setPracticeResult(null);
  };

  const handlePracticeComplete = (result, errorType, question) => {
    setPracticeResult(result);
    setLastErrorType(errorType);
    setLastQuestion(question);
  };

  const handleClosePractice = () => {
    setPracticeNode(null);
    setPracticeResult(null);
    setTreeKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <ConnectionStatus />
      <header className="bg-slate-800/95 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <span className="text-xl font-bold text-white">MasteryPath</span>
            </div>
            {selectedPath && (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-600">
                <span className="text-slate-300 font-medium">{selectedPath.name}</span>
                <button
                  onClick={() => {
                    setSelectedPath(null);
                    setPracticeNode(null);
                    setPracticeResult(null);
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  Change
                </button>
              </div>
            )}
            {selectedPath && (
              <nav className="flex gap-1">
                {Object.entries(TABS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMarketplace(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <span aria-hidden>🛒</span>
              Marketplace
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700"
            >
              {showHistory ? '← Back' : 'History'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 border border-slate-600"
            >
              {user?.email}
            </button>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
              Logout
            </button>
          </div>
        </div>
      </header>
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <main className="max-w-6xl mx-auto px-4 py-6 flex gap-6 w-full justify-center">
        {selectedPath && !showHistory && !practiceNode && !practiceResult && (
          <aside className="w-56 shrink-0 space-y-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Today</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Review Due: {pathStats != null ? pathStats.reviewDueCount : '—'}</p>
                <p>Streak: {heatmapData != null ? heatmapData.currentStreak : '—'}</p>
                <p>Mastered: {pathStats != null && pathStats.totalNodes > 0
                  ? `${Math.round((pathStats.masteredCount / pathStats.totalNodes) * 100)}%`
                  : '—'}</p>
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center text-xs">🔒</span>
                  <span className="text-slate-400">Locked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/80 border border-amber-400 flex items-center justify-center text-xs">✓</span>
                  <span className="text-slate-400">Needs Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/80 border border-sky-400 flex items-center justify-center text-xs">•</span>
                  <span className="text-slate-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <span className="text-slate-400">Mastered</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPublishMarketplace(true)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Publish to Marketplace
            </button>
          </aside>
        )}
        <div className="flex-1 min-w-0 w-full flex flex-col items-center">
          {showHistory ? (
            <PracticeHistory onClose={() => setShowHistory(false)} />
          ) : practiceResult ? (
            <PracticeResult
              result={practiceResult}
              nodeName={practiceNode?.name}
              onClose={handleClosePractice}
              onRetry={() => setPracticeResult(null)}
              onNextRecommended={() => {
                handleClosePractice();
                setActiveTab('review');
              }}
              lastErrorType={lastErrorType}
              lastQuestion={lastQuestion}
            />
          ) : practiceNode ? (
            <PracticeErrorBoundary onClose={handleClosePractice}>
              <PracticeSession
                node={practiceNode}
                onComplete={handlePracticeComplete}
                onCancel={handleClosePractice}
              />
            </PracticeErrorBoundary>
          ) : showMarketplace ? (
            <MarketplaceBrowser
              onClose={() => setShowMarketplace(false)}
              onMakeYourOwn={() => setShowMarketplace(false)}
              onImportPath={(path) => {
                setSelectedPath(path);
                setShowMarketplace(false);
              }}
            />
          ) : selectedPath ? (
            activeTab === 'map' ? (
              <SkillTree
                key={treeKey}
                pathId={selectedPath.id}
                onStartPractice={handleStartPractice}
              />
            ) : activeTab === 'review' ? (
              <ReviewQueue
                pathId={selectedPath.id}
                pathName={selectedPath.name}
                onStartPractice={handleStartPractice}
              />
            ) : (
              <AnalyticsDashboard />
            )
          ) : (
            <PathSelector
              onSelectPath={setSelectedPath}
              onShowMarketplace={() => setShowMarketplace(true)}
            />
          )}
      {showPublishMarketplace && selectedPath && (
        <PublishToMarketplaceModal
          path={selectedPath}
          onClose={() => setShowPublishMarketplace(false)}
          onPublished={() => setShowPublishMarketplace(false)}
        />
      )}
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-4 animate-pulse">
            <span className="text-2xl">📚</span>
          </div>
          <div className="text-slate-400">Loading...</div>
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
