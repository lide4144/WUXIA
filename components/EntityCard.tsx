import React, { useEffect, useRef, useState } from 'react';
import { Entity } from '../types';
import { HealthBar } from './HealthBar';

interface EntityCardProps {
  entity: Entity;
  isPlayer?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({ entity, isPlayer }) => {
  const prevHp = useRef(entity.stats.hp);
  const prevQi = useRef(entity.stats.qi);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    let newAnim = '';
    
    // Check for HP changes first (Priority)
    if (entity.stats.hp < prevHp.current) {
      // Damage taken: Shake + Red flash
      newAnim = 'animate-shake border-red-800 shadow-red-900/20';
    } else if (entity.stats.hp > prevHp.current) {
      // Healed: Green flash
      newAnim = 'border-green-700 shadow-green-900/20 scale-[1.02]';
    } else if (entity.stats.qi > prevQi.current) {
      // Qi recovered: Blue flash
      newAnim = 'border-blue-700 shadow-blue-900/20';
    } else if (entity.stats.qi < prevQi.current) {
      // Qi used: Subtle pulse
      newAnim = 'border-ink-600';
    }

    if (newAnim) {
      setAnimClass(newAnim);
      const timer = setTimeout(() => setAnimClass(''), 500);
      
      // Update refs
      prevHp.current = entity.stats.hp;
      prevQi.current = entity.stats.qi;
      
      return () => clearTimeout(timer);
    }

    // Update refs if no animation triggered (e.g. init)
    prevHp.current = entity.stats.hp;
    prevQi.current = entity.stats.qi;
  }, [entity.stats.hp, entity.stats.qi]);

  return (
    <div className={`
      p-6 border-2 bg-ink-50 shadow-lg relative 
      transition-all duration-300 ease-out
      ${isPlayer ? 'rounded-tl-xl' : 'rounded-br-xl'}
      ${animClass || 'border-ink-800'}
    `}>
      {/* Corner decorations - inherit border color to match flash */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-inherit"></div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-inherit"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-inherit"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-inherit"></div>

      <div className="mb-4 text-center">
        <h3 className="text-sm text-ink-500 font-serif uppercase tracking-widest">{entity.title}</h3>
        <h2 className="text-2xl font-calligraphy text-ink-900">{entity.name}</h2>
      </div>

      <div className="space-y-3">
        <HealthBar current={entity.stats.hp} max={entity.stats.maxHp} type="hp" />
        <HealthBar current={entity.stats.qi} max={entity.stats.maxQi} type="qi" />
      </div>

      <div className="mt-4 text-xs text-ink-600 font-serif italic border-t border-ink-200 pt-2">
        {entity.description}
      </div>
    </div>
  );
};