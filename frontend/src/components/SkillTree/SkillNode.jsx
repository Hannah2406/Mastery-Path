import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const statusStyles = {
  LOCKED: {
    bg: 'bg-slate-600',
    border: 'border-slate-500',
    text: 'text-slate-200',
    icon: '🔒',
  },
  AVAILABLE: {
    bg: 'bg-sky-600/80',
    border: 'border-sky-500',
    text: 'text-white',
    icon: '•',
  },
  MASTERED: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-white',
    icon: '✓',
  },
  DECAYING: {
    bg: 'bg-amber-600/90',
    border: 'border-amber-500',
    text: 'text-white',
    icon: '✓',
  },
};

function SkillNode({ data, selected }) {
  const { name, category, status, masteryScore, onClick } = data;
  const style = statusStyles[status] || statusStyles.LOCKED;
  const progressWidth = Math.round((masteryScore || 0) * 100);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />
      <div
        onClick={onClick}
        className={`
          px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-[160px] shadow-lg
          ${style.bg} ${style.border} ${style.text}
          ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}
          hover:brightness-110
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm opacity-90">{style.icon}</span>
          <span className="font-medium text-sm truncate">{name}</span>
        </div>
        <div className="text-xs opacity-80 mb-2 truncate">{category}</div>
        {status !== 'LOCKED' && (
          <div className="w-full bg-black/20 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-white/90 transition-all"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
    </>
  );
}

export default memo(SkillNode);
