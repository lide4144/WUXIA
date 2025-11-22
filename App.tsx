import React, { useState, useRef } from 'react';
import { GamePhase, Entity, Move, LogEntry, MoveType } from './types';
import { INITIAL_PLAYER_STATS, ENEMY_MOVES_POOL, STORY_CHAPTERS } from './constants';
import { generateEnemy, narrateTurn } from './services/geminiService';
import { EntityCard } from './components/EntityCard';
import { ActionPanel } from './components/ActionPanel';
import { CombatLog } from './components/CombatLog';
import { RefreshCcw, BookOpen, Trophy, Skull } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [stageIndex, setStageIndex] = useState(0);
  
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
  
  // Visual State
  const [playerAction, setPlayerAction] = useState<MoveType | null>(null);
  const [enemyAction, setEnemyAction] = useState<MoveType | null>(null);

  const addLog = (text: string, isSystem = false) => {
    setLogs(prev => [...prev, { turn: turnCount, text, isSystem }]);
  };

  // Initialize a fresh game
  const startGame = () => {
    setStageIndex(0);
    setPlayer(prev => ({
      ...prev,
      stats: { ...INITIAL_PLAYER_STATS }
    }));
    setPhase(GamePhase.STORY_INTERLUDE);
  };

  // Proceed from Story Interlude to Enemy Generation
  const startStageCombat = async () => {
    setPhase(GamePhase.GENERATING_ENEMY);
    setLogs([]);
    setTurnCount(1);

    const currentChapter = STORY_CHAPTERS[stageIndex];

    try {
      // Pass the chapter context to the AI
      const newEnemy = await generateEnemy(currentChapter.enemyPromptContext);
      
      // Scale enemy based on stage index for difficulty curve
      const difficultyMultiplier = 1 + (stageIndex * 0.15);
      newEnemy.stats.maxHp = Math.floor(newEnemy.stats.maxHp * difficultyMultiplier);
      newEnemy.stats.hp = newEnemy.stats.maxHp;
      newEnemy.stats.atk = Math.floor(newEnemy.stats.atk * difficultyMultiplier);

      setEnemy(newEnemy);
      addLog(`【${currentChapter.title}】开启`, true);
      addLog(`遭遇强敌：${newEnemy.title} ${newEnemy.name}！`, true);
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

    // 1. Basic Math Logic & Action Selection
    const newPlayerQi = Math.max(0, player.stats.qi - playerMove.cost);
    
    // Enemy Logic
    const enemyMoveName = ENEMY_MOVES_POOL[Math.floor(Math.random() * ENEMY_MOVES_POOL.length)];
    const enemyDamageRaw = Math.floor(Math.random() * (enemy.stats.atk - player.stats.def + 5)) + 5;
    const enemyActionType = Math.random() > 0.8 ? MoveType.DEFEND : MoveType.ATTACK;
    
    // Trigger Visual Effects
    setPlayerAction(playerMove.type);
    setEnemyAction(enemyActionType);
    
    // Player Logic
    let playerDamageDealt = 0;
    let playerHealed = 0;
    let playerQiRec = 0;

    if (playerMove.type === MoveType.ATTACK || playerMove.type === MoveType.ULTIMATE) {
      const rawDmg = playerMove.basePower + player.stats.atk;
      const mitigation = enemyActionType === MoveType.DEFEND ? enemy.stats.def * 2 : enemy.stats.def;
      playerDamageDealt = Math.max(1, Math.floor(rawDmg - mitigation + (Math.random() * 5)));
    } else if (playerMove.type === MoveType.HEAL) {
      playerHealed = playerMove.basePower;
      playerQiRec = 10; 
    }

    let enemyDamageDealt = 0;
    if (enemyActionType === MoveType.ATTACK) {
      const mitigation = playerMove.type === MoveType.DEFEND ? player.stats.def * 2.5 : player.stats.def;
      enemyDamageDealt = Math.max(0, Math.floor(enemyDamageRaw - mitigation));
    }

    const isVictory = (enemy.stats.hp - playerDamageDealt) <= 0;
    const isDefeat = (player.stats.hp - enemyDamageDealt + playerHealed) <= 0;

    // 2. Narrative
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

    // Clear visual effects after animation time
    setTimeout(() => {
      setPlayerAction(null);
      setEnemyAction(null);
    }, 1200);

    // 3. Update Stats
    setPlayer(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        hp: Math.min(prev.stats.maxHp, Math.max(0, prev.stats.hp - enemyDamageDealt + playerHealed)),
        qi: Math.min(prev.stats.maxQi, newPlayerQi + playerQiRec + 2)
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

    // 4. Check Phase
    if (isVictory) {
      setPhase(GamePhase.VICTORY);
    } else if (isDefeat) {
      setPhase(GamePhase.DEFEAT);
    } else {
      setTurnCount(prev => prev + 1);
      setPhase(GamePhase.PLAYER_TURN);
    }
  };

  const handleNextStage = () => {
    if (stageIndex + 1 < STORY_CHAPTERS.length) {
      setStageIndex(prev => prev + 1);
      // Heal player fully between chapters, reset Qi
      setPlayer(prev => ({
        ...prev,
        stats: { 
          ...prev.stats, 
          hp: prev.stats.maxHp,
          qi: INITIAL_PLAYER_STATS.qi 
        }
      }));
      setPhase(GamePhase.STORY_INTERLUDE);
    } else {
      setPhase(GamePhase.GAME_COMPLETE);
    }
  };

  const renderContent = () => {
    switch (phase) {
      case GamePhase.MENU:
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <h2 className="text-6xl md:text-8xl font-calligraphy text-ink-900 mb-2">决斗</h2>
              <p className="text-xl italic text-ink-600">"江湖路远，剑影无痕。"</p>
            </div>
            <div className="p-8 border-y-2 border-ink-800 w-full max-w-md text-center space-y-4">
               <p className="text-sm text-ink-500">
                 挑战AI生成的武林高手，书写你的江湖传奇。
               </p>
               <button 
                 onClick={startGame}
                 className="px-8 py-3 bg-ink-900 text-ink-50 font-bold hover:bg-seal transition-colors duration-300 w-full shadow-lg"
               >
                 踏入江湖
               </button>
            </div>
          </div>
        );

      case GamePhase.STORY_INTERLUDE:
        const chapter = STORY_CHAPTERS[stageIndex];
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in max-w-2xl mx-auto">
            <div className="bg-ink-50 border-2 border-ink-800 p-8 shadow-2xl relative w-full">
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-seal"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-seal"></div>
              
              <div className="text-center mb-8">
                <h3 className="text-seal text-lg font-serif tracking-widest mb-2">{chapter.title}</h3>
                <h2 className="text-4xl font-calligraphy text-ink-900">{chapter.introTitle}</h2>
              </div>
              
              <div className="text-lg leading-relaxed font-serif text-ink-800 mb-8 text-justify">
                {chapter.introText}
              </div>
              
              <button 
                 onClick={startStageCombat}
                 className="w-full py-4 border-2 border-ink-900 hover:bg-ink-900 hover:text-ink-50 transition-all font-bold flex items-center justify-center gap-2"
               >
                 <BookOpen size={20} />
                 <span>继续旅程</span>
               </button>
            </div>
          </div>
        );

      case GamePhase.GENERATING_ENEMY:
        return (
          <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <RefreshCcw className="animate-spin text-ink-400 mb-4" size={48} />
            <p className="font-calligraphy text-2xl text-ink-600">正在寻找对手...</p>
          </div>
        );

      case GamePhase.GAME_COMPLETE:
        return (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <div className="text-center space-y-6 p-10 border-4 border-double border-seal bg-ink-50 shadow-2xl">
              <Trophy size={64} className="text-yellow-600 mx-auto mb-4" />
              <h2 className="text-5xl font-calligraphy text-ink-900">称霸武林</h2>
              <p className="text-xl italic text-ink-600 max-w-md">
                你击败了所有强敌，名字已被载入江湖史册。从此江湖再无敌手。
              </p>
              <button 
                 onClick={() => setPhase(GamePhase.MENU)}
                 className="px-8 py-3 bg-seal text-white font-bold hover:bg-red-800 transition-colors duration-300 w-full"
               >
                 归隐山林 (返回主页)
               </button>
            </div>
          </div>
        );

      case GamePhase.PLAYER_TURN:
      case GamePhase.PROCESSING_TURN:
      case GamePhase.VICTORY:
      case GamePhase.DEFEAT:
        if (!enemy) return null;
        return (
          <div className="flex flex-col h-full space-y-6">
            {/* Arena Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
              <div className="order-2 md:order-1">
                 <EntityCard 
                   entity={player} 
                   isPlayer={true} 
                   activeAction={playerAction}
                 />
              </div>
              
              <div className="order-1 md:order-2 flex justify-center items-center relative">
                {/* VS indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-calligraphy text-ink-300 opacity-50 z-0 pointer-events-none">对决</div>
                <div className="w-full relative z-10">
                  <EntityCard 
                    entity={enemy} 
                    activeAction={enemyAction}
                  />
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
                 <div className="text-center p-6 bg-ink-800 text-ink-50 border-4 border-double border-seal shadow-xl animate-fade-in">
                   <h2 className="text-4xl font-calligraphy mb-2">
                     {phase === GamePhase.VICTORY ? '胜' : '败'}
                   </h2>
                   <p className="mb-4 text-ink-300 italic">
                     {phase === GamePhase.VICTORY 
                       ? "敌手已败，是否继续前行？" 
                       : "胜败乃兵家常事，请大侠重新来过……"}
                   </p>
                   
                   {phase === GamePhase.VICTORY ? (
                     <button 
                       onClick={handleNextStage}
                       className="px-8 py-3 bg-seal text-white font-bold hover:bg-red-700 transition-colors shadow-lg"
                     >
                       {stageIndex + 1 < STORY_CHAPTERS.length ? '下一关' : '领取奖励'}
                     </button>
                   ) : (
                     <button 
                       onClick={() => setPhase(GamePhase.MENU)}
                       className="px-6 py-2 border border-ink-50 hover:bg-ink-50 hover:text-ink-900 transition-colors"
                     >
                       重出江湖
                     </button>
                   )}
                 </div>
               )}

               <CombatLog logs={logs} />
            </div>
          </div>
        );
        
      default:
        return null;
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
        {phase !== GamePhase.MENU && phase !== GamePhase.GAME_COMPLETE && (
          <div className="text-sm font-serif text-ink-600">
            {STORY_CHAPTERS[stageIndex] ? STORY_CHAPTERS[stageIndex].title : ''}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 md:p-6 z-10 flex flex-col">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="w-full p-2 text-center text-xs text-ink-400 border-t border-ink-200">
        Gemini 驱动 • 水墨侠客
      </footer>
    </div>
  );
};

export default App;