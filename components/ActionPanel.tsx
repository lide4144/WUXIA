import React from 'react';
import { Move, MoveType } from '../types';
import { PLAYER_MOVES } from '../constants';
import { Sword, Shield, Zap, Heart } from 'lucide-react';

interface ActionPanelProps {
  currentQi: number;
  onSelectMove: (move: Move) => void;
  disabled: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ currentQi, onSelectMove, disabled }) => {
  const getIcon = (type: MoveType) => {
    switch (type) {
      case MoveType.ATTACK: return <Sword size={16} />;
      case MoveType.DEFEND: return <Shield size={16} />;
      case MoveType.HEAL: return <Heart size={16} />;
      case MoveType.ULTIMATE: return <Zap size={16} />;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {PLAYER_MOVES.map((move) => {
        const canAfford = currentQi >= move.cost;
        const isUsable = !disabled && canAfford;

        return (
          <button
            key={move.id}
            onClick={() => isUsable && onSelectMove(move)}
            disabled={!isUsable}
            className={`
              relative group flex items-center justify-between p-4 border border-ink-800 
              transition-all duration-200
              ${!isUsable 
                ? 'opacity-50 cursor-not-allowed bg-ink-100 text-ink-400' 
                : 'hover:bg-ink-800 hover:text-ink-50 bg-ink-50 text-ink-900 cursor-pointer active:translate-y-0.5'
              }
            `}
          >
            <div className="flex flex-col items-start">
              <span className="font-calligraphy text-lg">{move.name}</span>
              <span className="text-xs font-serif mt-1">{move.cost > 0 ? `内力: ${move.cost}` : '无消耗'}</span>
            </div>
            <div className={`${!isUsable ? 'text-ink-300' : 'text-seal group-hover:text-white'}`}>
              {getIcon(move.type)}
            </div>
          </button>
        );
      })}
    </div>
  );
};