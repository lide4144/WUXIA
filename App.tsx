import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, Entity, Move, LogEntry, MoveType } from './types';
import { INITIAL_PLAYER_STATS, ENEMY_MOVES_POOL } from './constants';
import { generateEnemy, narrateTurn } from './services/geminiService';
import { EntityCard } from './components/EntityCard';
import { ActionPanel } from './components/ActionPanel';
import { CombatLog } from './components/CombatLog';
import { RefreshCcw, Scroll } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [player, setPlayer] = useState<Entity>({
    id: 'player',
    name: '少侠',
    title: '初出茅庐',
    description: '一位怀揣武侠梦的江湖新人，身怀绝技。',
    stats: { ...INITIAL_PLAYER_STATS }
  });
  const [enemy, setEnemy] = useState<Entity | null>(null);
  const [turnCount, setTurnCount] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (text: string, isSystem = false) => {
    setLogs(prev => [...prev, { turn: turnCount, text, isSystem }]);
  };

  const startGame = async () => {
    setPhase(GamePhase.GENERATING_ENEMY);
    setLogs([]);
    setTurnCount(1);
    // Reset player stats
    setPlayer(prev => ({
      ...prev,
      stats: { ...INITIAL_PLAYER_STATS }
    }));

    try {
      const newEnemy = await generateEnemy();
      setEnemy(newEnemy);
      addLog(`挑战者出现：${newEnemy.title} ${newEnemy.name}！`, true);
      addLog(newEnemy.description, true);
      setPhase(GamePhase.PLAYER_TURN);
    } catch (e) {
      console.error(e);
      setPhase(GamePhase.MENU);
    }
  };

  const handlePlayerMove = async (playerMove: Move) => {
    if (!enemy || phase !== GamePhase.PLAYER_TURN) return;

    setPhase(GamePhase.PROCESSING_TURN);

    // 1. Basic Math Logic (Client Side for responsiveness)
    
    // Player Qi Cost
    const newPlayerQi = Math.max(0, player.stats.qi - playerMove.cost);
    
    // Enemy Move Selection (Random for now)
    const enemyMoveName = ENEMY_MOVES_POOL[Math.floor(Math.random() * ENEMY_MOVES_POOL.length)];
    // Simple enemy AI stats
    const enemyDamageRaw = Math.floor(Math.random() * (enemy.stats.atk - player.stats.def + 5)) + 5;
    const enemyActionType = Math.random() > 0.8 ? MoveType.DEFEND : MoveType.ATTACK;
    
    // Calculate Player Effect
    let playerDamageDealt = 0;
    let playerHealed = 0;
    let playerQiRec = 0;

    if (playerMove.type === MoveType.ATTACK || playerMove.type === MoveType.ULTIMATE) {
      // Base dmg + variation - enemy def
      const rawDmg = playerMove.basePower + player.stats.atk;
      const mitigation = enemyActionType === MoveType.DEFEND ? enemy.stats.def * 2 : enemy.stats.def;
      playerDamageDealt = Math.max(1, Math.floor(rawDmg - mitigation + (Math.random() * 5)));
    } else if (playerMove.type === MoveType.HEAL) {
      playerHealed = playerMove.basePower;
      playerQiRec = 10; // Meditate recovers Qi
    } else if (playerMove.type === MoveType.DEFEND) {
      // Reduces incoming damage
    }

    // Calculate Enemy Effect
    let enemyDamageDealt = 0;
    if (enemyActionType === MoveType.ATTACK) {
      const mitigation = playerMove.type === MoveType.DEFEND ? player.stats.def * 2.5 : player.stats.def;
      enemyDamageDealt = Math.max(0, Math.floor(enemyDamageRaw - mitigation));
    }

    // 2. Update Local State Temporarily (Optimistic UI) or Wait?
    // We wait for narrative to keep sync, but we could show "Thinking..."
    
    // 3. Gemini Narrative
    const isVictory = (enemy.stats.hp - playerDamageDealt) <= 0;
    const isDefeat = (player.stats.hp - enemyDamageDealt + playerHealed) <= 0; // Simplistic simultaneous KO check

    let narrative = '';
    try {
      narrative = await narrateTurn(
        player.name,
        playerMove,
        enemy.name,
        enemyMoveName,
        playerDamageDealt,
        enemyDamageDealt,
        isVictory,
        isDefeat
      );
    } catch (e) {
      narrative = "高手过招，快如闪电。";
    }

    // 4. Apply State Changes
    setPlayer(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        hp: Math.min(prev.stats.maxHp, Math.max(0, prev.stats.hp - enemyDamageDealt + playerHealed)),
        qi: Math.min(prev.stats.maxQi, newPlayerQi + playerQiRec + 2) // +2 passive regen
      }
    }));

    setEnemy(prev => prev ? ({
      ...prev,
      stats: {
        ...prev.stats,
        hp: Math.max(0, prev.stats.hp - playerDamageDealt)
      }
    }) : null);

    addLog(narrative);

    // 5. Check End Game
    if (isVictory) {
      setPhase(GamePhase.VICTORY);
    } else if (isDefeat) {
      setPhase(GamePhase.DEFEAT);
    } else {
      setTurnCount(prev => prev + 1);
      setPhase(GamePhase.PLAYER_TURN);
    }
  };

  return (
    <div className="min-h-screen bg-ink-100 text-ink-900 font-serif flex flex-col items-center relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 via-transparent to-transparent"></div>
      
      {/* Header */}
      <header className="w-full p-4 border-b-4 border-ink-800 bg-ink-50 z-10 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-seal flex items-center justify-center text-white font-calligraphy text-xl">墨</div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest">水墨侠客</h1>
        </div>
        {phase !== GamePhase.MENU && (
          <button onClick={() => setPhase(GamePhase.MENU)} className="text-xs underline hover:text-seal">
            返回江湖
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 md:p-6 z-10 flex flex-col">
        
        {/* MENU SCREEN */}
        {phase === GamePhase.MENU && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <h2 className="text-6xl md:text-8xl font-calligraphy text-ink-900 mb-2">决斗</h2>
              <p className="text-xl italic text-ink-600">"江湖路远，剑影无痕。"</p>
            </div>
            
            <div className="p-8 border-y-2 border-ink-800 w-full max-w-md text-center space-y-4">
               <p className="text-sm text-ink-500">
                 挑战AI生成的武林高手，比拼智慧与武功。
               </p>
               <button 
                 onClick={startGame}
                 className="px-8 py-3 bg-ink-900 text-ink-50 font-bold hover:bg-seal transition-colors duration-300 w-full"
               >
                 踏入江湖
               </button>
            </div>
          </div>
        )}

        {/* LOADING SCREEN */}
        {phase === GamePhase.GENERATING_ENEMY && (
          <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <RefreshCcw className="animate-spin text-ink-400 mb-4" size={48} />
            <p className="font-calligraphy text-2xl text-ink-600">正在寻找对手...</p>
          </div>
        )}

        {/* COMBAT LAYOUT */}
        {(phase === GamePhase.PLAYER_TURN || phase === GamePhase.PROCESSING_TURN || phase === GamePhase.VICTORY || phase === GamePhase.DEFEAT) && enemy && (
          <div className="flex flex-col h-full space-y-6">
            
            {/* Arena Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
              <div className="order-2 md:order-1">
                 <EntityCard entity={player} isPlayer={true} />
              </div>
              
              <div className="order-1 md:order-2 flex justify-center items-center relative">
                {/* VS indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-calligraphy text-ink-300 opacity-50 z-0 pointer-events-none">对决</div>
                <div className="w-full relative z-10">
                  <EntityCard entity={enemy} />
                </div>
              </div>
            </div>

            {/* Controls & Logs */}
            <div className="space-y-4">
               {phase === GamePhase.PROCESSING_TURN && (
                 <div className="text-center text-seal font-bold animate-pulse">
                   推演战局...
                 </div>
               )}

               {(phase === GamePhase.PLAYER_TURN || phase === GamePhase.PROCESSING_TURN) && (
                  <ActionPanel 
                    currentQi={player.stats.qi} 
                    onSelectMove={handlePlayerMove} 
                    disabled={phase === GamePhase.PROCESSING_TURN}
                  />
               )}

               {(phase === GamePhase.VICTORY || phase === GamePhase.DEFEAT) && (
                 <div className="text-center p-6 bg-ink-800 text-ink-50 border-4 border-double border-seal shadow-xl">
                   <h2 className="text-4xl font-calligraphy mb-2">
                     {phase === GamePhase.VICTORY ? '胜' : '败'}
                   </h2>
                   <p className="mb-4 text-ink-300 italic">
                     {phase === GamePhase.VICTORY ? "你的传说在江湖流传……" : "胜败乃兵家常事，请大侠重新来过……"}
                   </p>
                   <button 
                     onClick={() => setPhase(GamePhase.MENU)}
                     className="px-6 py-2 border border-ink-50 hover:bg-ink-50 hover:text-ink-900 transition-colors"
                   >
                     重出江湖
                   </button>
                 </div>
               )}

               <CombatLog logs={logs} />
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full p-2 text-center text-xs text-ink-400 border-t border-ink-200">
        Gemini 驱动 • 水墨侠客
      </footer>
    </div>
  );
};

export default App;