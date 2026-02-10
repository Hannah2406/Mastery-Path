import { useAuth } from '../../context/AuthContext';
import ContributionHeatmap from './ContributionHeatmap';

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
              <p className="text-slate-400">Your learning journey overview</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mb-8 p-6 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="text-sm font-semibold text-slate-400 mb-2">Email</div>
            <div className="text-xl font-bold text-white">{user?.email}</div>
          </div>
          <div className="border-t border-slate-700 pt-8">
            <ContributionHeatmap />
          </div>
        </div>
      </div>
    </div>
  );
}
