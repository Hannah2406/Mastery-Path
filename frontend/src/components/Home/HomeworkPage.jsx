export default function HomeworkPage({ onOpenMarkHomework, onOpenExtractText }) {
  return (
    <div className="w-full flex flex-col items-center min-h-full">
      <p className="text-[#6B7280] text-center mb-6 sm:mb-8 text-base sm:text-lg max-w-md">
        Upload your work to get feedback and a score, or extract text from PDFs and images.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl">
        <button
          type="button"
          onClick={() => onOpenMarkHomework?.()}
          className="group flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E9E7F5] shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#FF6FAE]/10 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6FAE]/40 focus:ring-offset-2 focus:ring-offset-[#FBFBFF]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FFE8F0] border-2 border-[#FF6FAE]/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-[#FF6FAE]/20 transition-colors">
            ✅
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1F2937] mb-2">Mark my homework</h2>
          <p className="text-sm sm:text-base text-[#6B7280]">
            Upload an image or PDF and get a score plus feedback.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onOpenExtractText?.()}
          className="group flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E9E7F5] shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#7C5CFF]/10 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:ring-offset-2 focus:ring-offset-[#FBFBFF]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#E8E4FF] border-2 border-[#7C5CFF]/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-[#7C5CFF]/20 transition-colors">
            📄
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1F2937] mb-2">Problems only (PDF)</h2>
          <p className="text-sm sm:text-base text-[#6B7280]">
            Remove handwriting, keep problems, generate a clean PDF.
          </p>
        </button>
      </div>
    </div>
  );
}
