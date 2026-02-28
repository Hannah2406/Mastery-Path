import { useAuth } from '../../context/AuthContext';

/* Cohesive palette: violet/slate base with soft accent per card */
const CARDS = [
  { key: 'practice', title: 'Start practicing', description: 'Choose a learning path and practice on the map', icon: '🗺️', accent: 'violet' },
  { key: 'homework', title: 'Homework', description: 'Upload your work to get marked or extract text', icon: '📄', accent: 'amber' },
  { key: 'marketplace', title: 'Marketplace', description: 'Browse and import courses from the community', icon: '🛒', accent: 'sky' },
  { key: 'history', title: 'Practice history', description: 'See your past sessions and progress', icon: '📋', accent: 'emerald' },
  { key: 'review', title: 'Review', description: 'Skills due for review (after you pick a path)', icon: '🔄', accent: 'rose' },
  { key: 'analytics', title: 'Analytics', description: 'Your progress and mastery (after you pick a path)', icon: '📊', accent: 'indigo' },
];

/* Accent highlights (lavender + mint from palette) */
const ACCENT_CLASSES = {
  violet: 'bg-[#E8E4FF] border-[#7C5CFF]/30 text-[#4A3F99]',
  amber: 'bg-[#FFE8F0] border-[#FF6FAE]/30 text-[#9E3D6B]',
  sky: 'bg-[#E4F9FF] border-[#7C5CFF]/30 text-[#4A3F99]',
  emerald: 'bg-[#E0FBF4] border-[#4CD7B0]/40 text-[#0D7A5E]',
  rose: 'bg-[#FFE8F0] border-[#FF6FAE]/30 text-[#9E3D6B]',
  indigo: 'bg-[#E8E4FF] border-[#7C5CFF]/40 text-[#4A3F99]',
};

export default function HomePage({ onNavigate, onOpenHomework }) {
  const { user, logout } = useAuth();

  const handleCardClick = (key) => {
    onNavigate?.(key);
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#FBFBFF]">
      <header className="sticky top-0 z-30 shrink-0 border-b border-[#E9E7F5] bg-[#FFFFFF]/90 backdrop-blur-md shadow-sm shadow-black/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#7C5CFF] flex items-center justify-center text-white shadow-lg shadow-[#7C5CFF]/25">
              <span className="text-xl">📚</span>
            </div>
            <span className="font-heading text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">MasteryPath</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-base font-bold text-[#6B7280] truncate max-w-[120px] sm:max-w-[200px] md:max-w-none hidden sm:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="text-base font-bold text-[#6B7280] hover:text-[#1F2937] px-4 py-2.5 rounded-xl border border-[#E9E7F5] bg-transparent hover:bg-[#FBFBFF] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full min-h-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1F2937] mb-3 leading-tight tracking-tight">
            Where would you like to go?
          </h1>
          <p className="text-[#6B7280] text-lg sm:text-xl font-semibold max-w-md">
            Choose a mode below
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 justify-items-center flex-1 min-h-0">
          {CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => handleCardClick(card.key)}
              className="group relative w-full max-w-sm text-left p-5 sm:p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9E7F5] shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#7C5CFF]/10 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:ring-offset-2 focus:ring-offset-[#FBFBFF]"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 border-2 ${ACCENT_CLASSES[card.accent]}`}>
                {card.icon}
              </div>
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-[#1F2937] mb-1.5 sm:mb-2">{card.title}</h2>
              <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed font-medium">{card.description}</p>
              <span className="absolute top-4 right-4 text-lg text-[#6B7280] group-hover:text-[#7C5CFF] group-hover:translate-x-0.5 transition-all" aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-[#6B7280] text-base sm:text-lg font-semibold mt-8 sm:mt-10 max-w-md px-2">
          Pick a path and practice on the map, or jump straight to Homework or Marketplace.
        </p>
      </main>
    </div>
  );
}
