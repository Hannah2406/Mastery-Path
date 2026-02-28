/**
 * Shared page layout: header with Back to home + logo + title, and centered main content.
 * Use for every non-home view so each "page" has a dashboard-like shell and content in the middle.
 */
export default function PageLayout({ title, onBack, children, maxWidth = 'max-w-6xl' }) {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col w-full bg-[#FBFBFF]">
      <header className="sticky top-0 z-40 shrink-0 border-b border-[#E9E7F5] bg-[#FFFFFF]/95 backdrop-blur-sm shadow-sm shadow-black/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#FBFBFF] border border-[#E9E7F5] transition-colors text-sm sm:text-base font-medium"
              aria-label="Back to home"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Back to home</span>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#7C5CFF] flex items-center justify-center text-white shadow-md shadow-[#7C5CFF]/25">
                <span className="text-lg">📚</span>
              </div>
              <span className="font-heading text-lg sm:text-xl font-bold text-[#1F2937] truncate">MasteryPath</span>
            </div>
          </div>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-[#1F2937] truncate text-center flex-1 min-w-0">
            {title}
          </h1>
          <div className="w-[100px] sm:w-[120px] shrink-0" aria-hidden />
        </div>
      </header>

      <main className="flex-1 w-full min-h-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className={`w-full ${maxWidth} mx-auto flex flex-col items-center justify-center min-h-0`}>
          {children}
        </div>
      </main>
    </div>
  );
}
