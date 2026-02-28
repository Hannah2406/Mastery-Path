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
import FileUploadModal from './components/Practice/FileUploadModal';
import HomePage from './components/Home/HomePage';
import HomeworkPage from './components/Home/HomeworkPage';
import PageLayout from './components/Layout/PageLayout';
import ReviewPageContent from './components/Review/ReviewPageContent';
import { getHeatmap } from './api/history';
import { getPathStats } from './api/paths';

const TABS = { map: 'Map', review: 'Review', analytics: 'Analytics' };

function Dashboard({ onGoHome, showHomeworkModal, setShowHomeworkModal, homeworkModalInitialMode, openPanel, onClearOpenPanel }) {
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
    if (openPanel === 'marketplace') {
      setShowMarketplace(true);
      onClearOpenPanel?.();
    } else if (openPanel === 'history') {
      setShowHistory(true);
      onClearOpenPanel?.();
    } else if (openPanel === 'review') {
      setActiveTab('review');
      onClearOpenPanel?.();
    } else if (openPanel === 'analytics') {
      setActiveTab('analytics');
      onClearOpenPanel?.();
    }
  }, [openPanel, onClearOpenPanel]);

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
    <div className="min-h-screen min-h-dvh flex flex-col w-full bg-[#FBFBFF] text-[#1F2937]">
      <ConnectionStatus />
      <header className="w-full shrink-0 bg-[#FFFFFF]/95 border-b border-[#E9E7F5] sticky top-0 z-40 shadow-sm shadow-black/5 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#7C5CFF] flex items-center justify-center shadow-md shadow-[#7C5CFF]/25">
                <span className="text-xl sm:text-2xl">📚</span>
              </div>
              <span className="font-heading text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">MasteryPath</span>
            </div>
            {selectedPath && (
              <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-[#E9E7F5]">
                <span className="text-[#6B7280] font-bold text-base sm:text-lg truncate max-w-[120px] sm:max-w-none">{selectedPath.name}</span>
                <button
                  onClick={() => {
                    setSelectedPath(null);
                    setPracticeNode(null);
                    setPracticeResult(null);
                  }}
                  className="text-base sm:text-lg text-[#7C5CFF] hover:text-[#6B4CE6] font-bold"
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
                    className={`px-4 py-2.5 rounded-xl text-base font-bold transition-colors ${
                      activeTab === key ? 'bg-[#7C5CFF]/15 text-[#7C5CFF]' : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#FBFBFF]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-transparent hover:bg-[#FBFBFF] text-[#6B7280] hover:text-[#1F2937] rounded-xl text-base font-bold transition-colors border border-[#E9E7F5]"
              >
                <span aria-hidden>🏠</span>
                Home
              </button>
            )}
            <button
              onClick={() => setShowHomeworkModal?.(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-[#FF6FAE] hover:bg-[#F2559A] text-white rounded-xl text-base font-bold transition-colors shadow-md shadow-[#FF6FAE]/20"
            >
              <span aria-hidden>📄</span>
              Homework
            </button>
            <button
              onClick={() => setShowMarketplace(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl text-base font-bold transition-colors shadow-md shadow-[#7C5CFF]/20"
            >
              <span aria-hidden>🛒</span>
              Marketplace
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-base font-bold text-[#6B7280] hover:text-[#1F2937] px-4 py-2.5 rounded-xl hover:bg-[#FBFBFF] transition-colors"
            >
              {showHistory ? '← Back' : 'History'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="text-base font-bold text-[#6B7280] hover:text-[#1F2937] px-4 py-2.5 rounded-xl hover:bg-[#FBFBFF] border border-[#E9E7F5] transition-colors truncate max-w-[140px] sm:max-w-none"
            >
              {user?.email}
            </button>
            <button onClick={logout} className="text-base font-bold text-[#EF4444] hover:text-[#B91C1C] px-4 py-2.5 rounded-xl transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      {showHomeworkModal != null && showHomeworkModal && (
        <FileUploadModal
          onClose={() => setShowHomeworkModal(false)}
          defaultTopic={selectedPath?.name ?? ''}
          initialMode={homeworkModalInitialMode ?? 'mark'}
          showGetHomeworkTab={false}
        />
      )}
      <main className="w-full flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center items-center lg:items-stretch px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-[#FBFBFF]">
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
        {selectedPath && !showHistory && !practiceNode && !practiceResult && (
          <aside className="w-full lg:w-56 shrink-0 space-y-4 order-last lg:order-first">
            <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl p-4 sm:p-5 shadow-sm shadow-black/5">
              <h3 className="font-heading text-sm sm:text-base font-semibold text-[#1F2937] mb-2 sm:mb-3">Today</h3>
              <div className="space-y-2 text-sm sm:text-base text-[#6B7280]">
                <p>Review Due: {pathStats != null ? pathStats.reviewDueCount : '—'}</p>
                <p>Streak: {heatmapData != null ? heatmapData.currentStreak : '—'}</p>
                <p>Mastered: {pathStats != null && pathStats.totalNodes > 0
                  ? `${Math.round((pathStats.masteredCount / pathStats.totalNodes) * 100)}%`
                  : '—'}</p>
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl p-4 sm:p-5 shadow-sm shadow-black/5">
              <h3 className="font-heading text-sm sm:text-base font-semibold text-[#1F2937] mb-2 sm:mb-3">Legend</h3>
              <div className="space-y-2.5 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E9E7F5] border border-[#E9E7F5] flex items-center justify-center text-xs">🔒</span>
                  <span className="text-[#6B7280]">Locked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#F59E0B]/30 border border-[#F59E0B]/50 flex items-center justify-center text-xs">✓</span>
                  <span className="text-[#6B7280]">Needs Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#7C5CFF]/30 border border-[#7C5CFF]/50 flex items-center justify-center text-xs">•</span>
                  <span className="text-[#6B7280]">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#4CD7B0]/50 border border-[#4CD7B0]/60 flex items-center justify-center text-xs">✓</span>
                  <span className="text-[#6B7280]">Mastered</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPublishMarketplace(true)}
              className="w-full py-2.5 sm:py-3 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-medium text-sm sm:text-base transition-colors shadow-md shadow-[#7C5CFF]/20"
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
                pathName={selectedPath?.name}
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
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="w-full max-w-3xl mx-auto">
                <PathSelector
                  onSelectPath={setSelectedPath}
                  onShowMarketplace={() => setShowMarketplace(true)}
                />
              </div>
            </div>
          )}
      {showPublishMarketplace && selectedPath && (
        <PublishToMarketplaceModal
          path={selectedPath}
          onClose={() => setShowPublishMarketplace(false)}
          onPublished={() => setShowPublishMarketplace(false)}
        />
      )}
        </div>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('home');
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkModalMode, setHomeworkModalMode] = useState('get'); // 'get' | 'mark'
  const [openPanel, setOpenPanel] = useState(null);

  const goHome = () => setView('home');

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#FBFBFF] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#7C5CFF] rounded-2xl mb-4 animate-pulse shadow-lg shadow-[#7C5CFF]/25">
            <span className="text-2xl">📚</span>
          </div>
          <div className="text-[#6B7280] font-medium text-base sm:text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (view === 'home') {
    return (
      <>
        <HomePage onNavigate={(key) => setView(key)} />
      </>
    );
  }

  if (view === 'practice') {
    const openHomeworkModalFromPractice = (open) => {
      if (open) setHomeworkModalMode('mark');
      setShowHomeworkModal(!!open);
    };
    return (
      <Dashboard
        onGoHome={goHome}
        showHomeworkModal={showHomeworkModal}
        setShowHomeworkModal={openHomeworkModalFromPractice}
        homeworkModalInitialMode={homeworkModalMode}
        openPanel={openPanel}
        onClearOpenPanel={() => setOpenPanel(null)}
      />
    );
  }

  if (view === 'homework') {
    return (
      <>
        <PageLayout title="Homework" onBack={goHome}>
          <HomeworkPage
            onOpenMarkHomework={() => { setHomeworkModalMode('mark'); setShowHomeworkModal(true); }}
            onOpenExtractText={() => { setHomeworkModalMode('extract'); setShowHomeworkModal(true); }}
          />
        </PageLayout>
        {showHomeworkModal && (
          <FileUploadModal
            onClose={() => setShowHomeworkModal(false)}
            defaultTopic=""
            initialMode={homeworkModalMode}
            showGetHomeworkTab={false}
          />
        )}
      </>
    );
  }

  if (view === 'marketplace') {
    return (
      <PageLayout title="Marketplace" onBack={goHome} maxWidth="max-w-5xl">
        <div className="w-full flex justify-center">
          <MarketplaceBrowser
            onClose={goHome}
            onMakeYourOwn={() => setView('practice')}
            onImportPath={() => setView('practice')}
          />
        </div>
      </PageLayout>
    );
  }

  if (view === 'history') {
    return (
      <PageLayout title="Practice history" onBack={goHome} maxWidth="max-w-4xl">
        <div className="w-full flex justify-center">
          <PracticeHistory onClose={goHome} />
        </div>
      </PageLayout>
    );
  }

  if (view === 'review') {
    return (
      <PageLayout title="Review" onBack={goHome} maxWidth="max-w-3xl">
        <div className="w-full flex justify-center">
          <ReviewPageContent onStartPractice={() => setView('practice')} />
        </div>
      </PageLayout>
    );
  }

  if (view === 'analytics') {
    return (
      <PageLayout title="Analytics" onBack={goHome} maxWidth="max-w-5xl">
        <div className="w-full flex justify-center">
          <AnalyticsDashboard />
        </div>
      </PageLayout>
    );
  }

  return null;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
