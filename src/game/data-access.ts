import { baseActions, baseBosses, baseEnemies, towerDefinitions } from '../data/baseSet';
import type { ActionCard, BossCard, CardFaceData, EnemyCard, GameState, TowerCell, TowerDefinition } from './types';

export function getAction(cardId: string): ActionCard | undefined {
  return baseActions.find((card) => card.id === cardId);
}

export function getActiveCardFace(card: ActionCard, flippedCards: string[]): CardFaceData {
  if (card.level2 && flippedCards.includes(card.id)) {
    return card.level2;
  }
  return { manaCost: card.manaCost, effects: card.effects, text: card.text, traits: card.traits };
}

export function isCardFlipped(cardId: string, flippedCards: string[]): boolean {
  return flippedCards.includes(cardId);
}

export function canFlipCard(cardId: string, flippedCards: string[]): boolean {
  const card = getAction(cardId);
  return !!card?.level2 && !flippedCards.includes(cardId);
}

export function flipCard(state: GameState, cardId: string): GameState {
  if (!canFlipCard(cardId, state.flippedCards)) return state;
  return { ...state, flippedCards: [...state.flippedCards, cardId] };
}

export function resolveCardForDisplay(card: ActionCard, flippedCards: string[]): ActionCard {
  if (!card.level2 || !flippedCards.includes(card.id)) return card;
  return {
    ...card,
    manaCost: card.level2.manaCost,
    effects: card.level2.effects,
    text: card.level2.text,
    traits: card.level2.traits ?? card.traits,
  };
}

export function getEnemy(enemyId: string): EnemyCard | undefined {
  return baseEnemies.find((enemy) => enemy.id === enemyId);
}

export function getBoss(bossId: string): BossCard | undefined {
  return baseBosses.find((boss) => boss.id === bossId);
}

export function getTower(towerId: string): TowerDefinition | undefined {
  return towerDefinitions.find((tower) => tower.id === towerId);
}

export function getCurrentTower(state: Pick<GameState, 'towerId'>): TowerDefinition {
  return getTower(state.towerId) ?? towerDefinitions[0];
}

export function getCurrentTowerCells(state: Pick<GameState, 'towerId'>): TowerCell[] {
  return getCurrentTower(state).cells;
}

export function getCurrentCell(state: GameState): TowerCell {
  return getCell(state, state.position) ?? getCurrentTower(state).cells[0];
}

export function getCell(state: Pick<GameState, 'towerId'>, cellId: string): TowerCell | undefined {
  return getCurrentTower(state).cells.find((cell) => cell.id === cellId);
}
