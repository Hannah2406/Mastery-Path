import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const statusColors = {
  LOCKED: {
    bg: 'bg-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-500',
    icon: '🔒',
    animate: '',
  },
  AVAILABLE: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-700',
    icon: '📖',
    animate: '',
  },
  MASTERED: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: '✅',
    animate: '',
  },
  DECAYING: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    icon: '⚠️',
    animate: 'animate-pulse',
  },
};

function SkillNode({ data, selected }) {
  const { name, category, status, masteryScore, onClick } = data;
  const colors = statusColors[status] || statusColors.LOCKED;
  const progressWidth = Math.round((masteryScore || 0) * 100);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div
        onClick={onClick}
        className={`
          px-4 py-3 rounded-lg border-2 cursor-pointer transition-all min-w-[160px]
          ${colors.bg} ${colors.border} ${colors.animate}
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          hover:shadow-md
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{colors.icon}</span>
          <span className={`font-medium text-sm ${colors.text}`}>{name}</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">{category}</div>
        {status !== 'LOCKED' && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                status === 'MASTERED'
                  ? 'bg-green-500'
                  : status === 'DECAYING'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </>
  );
}

export default memo(SkillNode);
