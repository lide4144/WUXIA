import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface CombatLogProps {
  logs: LogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-48 md:h-64 border-t-4 border-ink-800 bg-ink-50 relative overflow-hidden flex flex-col">
       <div className="absolute top-0 left-0 bg-ink-800 text-ink-50 px-2 py-1 text-xs font-serif z-10">
        江湖传闻
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pt-8 space-y-4 font-serif text-ink-900"
      >
        {logs.length === 0 && (
          <div className="text-center text-ink-400 italic mt-4">卷轴空空如也……</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className={`animate-fade-in ${log.isSystem ? 'text-center text-ink-500 text-sm italic' : 'text-left'}`}>
            {!log.isSystem && <span className="font-bold text-seal mr-2">回合 {log.turn}:</span>}
            <span className="leading-relaxed">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};