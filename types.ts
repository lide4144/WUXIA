export enum GamePhase {
  MENU = 'MENU',
  GENERATING_ENEMY = 'GENERATING_ENEMY',
  PLAYER_TURN = 'PLAYER_TURN',
  PROCESSING_TURN = 'PROCESSING_TURN',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export interface EntityStats {
  hp: number;
  maxHp: number;
  qi: number; // Internal energy, used for skills
  maxQi: number;
  atk: number; // Base attack
  def: number; // Base defense
}

export interface Entity {
  id: string;
  name: string;
  title: string; // e.g., "Wandering Swordsman"
  description: string;
  stats: EntityStats;
  avatarUrl?: string; // Placeholder logic
}

export enum MoveType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  HEAL = 'HEAL',
  ULTIMATE = 'ULTIMATE',
}

export interface Move {
  id: string;
  name: string;
  type: MoveType;
  cost: number; // Qi cost
  basePower: number;
  description: string;
}

export interface LogEntry {
  turn: number;
  text: string;
  isSystem?: boolean; // For non-narrative messages like "Game Start"
}

export interface TurnResult {
  playerDamageTaken: number;
  enemyDamageTaken: number;
  playerHealed: number;
  enemyHealed: number;
  narrative: string;
}