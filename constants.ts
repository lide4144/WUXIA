import { Move, MoveType, EntityStats } from './types';

export const INITIAL_PLAYER_STATS: EntityStats = {
  hp: 100,
  maxHp: 100,
  qi: 50,
  maxQi: 50,
  atk: 15,
  def: 5,
};

export const PLAYER_MOVES: Move[] = [
  {
    id: 'basic_strike',
    name: '铁剑式',
    type: MoveType.ATTACK,
    cost: 0,
    basePower: 10,
    description: '基础剑招，朴实无华但稳健有效。',
  },
  {
    id: 'meditate',
    name: '调息',
    type: MoveType.HEAL,
    cost: 0, // Gains Qi actually, handled in logic
    basePower: 15, // Amount healed/recovered
    description: '运转周天，恢复少量内力和气血。',
  },
  {
    id: 'palm_strike',
    name: '降龙掌',
    type: MoveType.ATTACK,
    cost: 15,
    basePower: 25,
    description: '刚猛无匹的一掌，灌注了深厚的内力。',
  },
  {
    id: 'ultimate',
    name: '万剑归宗',
    type: MoveType.ULTIMATE,
    cost: 40,
    basePower: 50,
    description: '无上剑道境界，万剑齐发，需消耗大量内力。',
  },
];

// Simplified enemy logic uses these abstractly
export const ENEMY_MOVES_POOL = [
  '猛虎下山',
  '暴雨梨花针',
  '金钟罩',
  '凌波微步',
  '开山拳',
  '黑虎掏心',
  '无影脚',
  '化骨绵掌'
];