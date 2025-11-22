import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  type: 'hp' | 'qi';
  label?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({ current, max, type, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const colorClass = type === 'hp' ? 'bg-seal' : 'bg-stone-600';
  const labelText = label || (type === 'hp' ? '气血' : '内力');

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-xs font-serif mb-1 text-ink-800">
        <span>{labelText}</span>
        <span>{current} / {max}</span>
      </div>
      <div className="w-full h-3 bg-ink-200 border border-ink-300 relative">
        <div 
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};