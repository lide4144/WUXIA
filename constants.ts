import { Move, MoveType, EntityStats, StoryChapter } from './types';

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

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: "第一章：初出茅庐",
    introTitle: "山门之下",
    introText: "你拜别了师父，背着一把铁剑走下山门。江湖路远，刚到山脚驿站，便见一群恶徒在欺压良善。要想闯荡江湖，这便是你的第一战。",
    enemyPromptContext: "Enemy should be a rough bandit leader, local ruffian, or corrupt soldier. Low-level boss vibe.",
  },
  {
    id: 2,
    title: "第二章：宿命之敌",
    introTitle: "竹林迷阵",
    introText: "虽然击退了恶徒，但你也因此卷入了江湖纷争。在穿过一片迷雾竹林时，一阵琴声传来。一名身手不凡的杀手已在此等候多时，听说他是你师门的弃徒。",
    enemyPromptContext: "Enemy should be a skilled assassin, a rogue martial artist, or a musician killer using sound waves. Mysterious and calm.",
  },
  {
    id: 3,
    title: "第三章：武林之巅",
    introTitle: "决战光明顶",
    introText: "经历了无数腥风血雨，你终于站在了传说中的决斗之地。眼前这位，便是统领黑白两道的霸主。只要击败他，你的名字将响彻整个武林。",
    enemyPromptContext: "Enemy should be a legendary grandmaster, sect leader, or an old monster with immense power. High HP and intimidating title.",
  },
];