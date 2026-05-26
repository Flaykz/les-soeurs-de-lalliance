import { baseActions, baseBosses, towerDefinitions } from '../data/baseSet';
import type { BossCard, GameState } from './types';
import { getBoss, getTower } from './data-access';
import { continuePendingResolution } from './cells';
import { drawCards, createActionDeck } from './cards';
import { STARTING_HEALTH } from './health';
import { shuffle } from './utils';

export const ADVANCED_ACTION_XP_COST = 2;

export function createInitialGameState(bossId: string, options: { useLocations?: boolean } = {}): GameState {
  const { useLocations = false } = options;
  const deck = shuffle(createActionDeck(useLocations));
  const advancedDeck = shuffle(baseActions.filter((card) => card.kind === 'advanced-action').map((card) => card.id));
  const boss = getBoss(bossId) ?? baseBosses[0];
  const towerIds = createTowerSequence(boss);
  const tower = getTower(towerIds[0]) ?? towerDefinitions[0];

  return drawCards({
    bossId: boss.id,
    health: STARTING_HEALTH,
    healthLimit: STARTING_HEALTH,
    xp: 0,
    mana: null,
    potions: 0,
    currentFloor: 1,
    towerId: tower.id,
    towerIds,
    currentTowerIndex: 0,
    towerSequenceCount: 0,
    position: tower.startingCellId,
    phase: 'movement-roll',
    movementDice: null,
    selectedMovement: null,
    pendingMovementPaths: [],
    selectedMovementPathIndex: null,
    pendingTraps: [],
    pendingCellRoll: null,
    pendingTrapLevelDiscard: null,
    pendingTreasureChoice: null,
    pendingCombatGroups: [],
    pendingTreasures: [],
    pendingBossCellId: null,
    deck,
    advancedDecks: [advancedDeck.slice(0, 4), advancedDeck.slice(4, 8)],
    hand: [],
    discard: [],
    resolvedCells: [tower.startingCellId],
    activeCombat: null,
    combatFeedback: null,
    activeBossCombat: null,
    bossCombatFeedback: null,
    playerFeedback: null,
    trapFeedback: null,
    treasureFeedback: null,
    blockedMovementFeedback: null,
    flippedCards: [],
    banishableCardId: null,
    pendingHasteAttack: null,
    manaJustRolled: false,
    useLocations,
    pendingEnemyReroll: null,
    pendingKeywordCancel: false,
    pendingRemoveFromCombat: false,
    pendingSelfDamageX: null,
    log: [`Boss choisi : ${boss.name}. Deck action melange, main de depart piochee. ${tower.name} commence.`]
  });
}

export function completeCombatFeedback(state: GameState): GameState {
  if (!state.activeCombat || !state.combatFeedback) {
    return state;
  }

  // Phase 1 coriace terminée → appliquer la résurrection et lancer la phase 2
  if (state.combatFeedback.coriaceReviving && state.combatFeedback.coriaceRevivedAttack !== undefined) {
    const { targetInstanceId, coriaceRevivedAttack } = state.combatFeedback;
    const revivedEnemies = state.activeCombat.enemies.map((e) =>
      e.instanceId === targetInstanceId
        ? { ...e, enemyHealth: 1, resolvedAttack: coriaceRevivedAttack, coriaceRevived: true }
        : e
    );
    return {
      ...state,
      activeCombat: { ...state.activeCombat, enemies: revivedEnemies },
      combatFeedback: { targetInstanceId, damage: 0, defeated: false, xpGained: 0, combatEnded: false, coriaceJustRevived: true, coriaceRevivedAttack }
    };
  }

  const remainingEnemies = state.activeCombat.enemies.filter((enemy) => enemy.enemyHealth > 0);
  if (remainingEnemies.length > 0) {
    return {
      ...state,
      activeCombat: { ...state.activeCombat, enemies: remainingEnemies },
      combatFeedback: null
    };
  }

  return continuePendingResolution({
      ...state,
      activeCombat: null,
      combatFeedback: null,
      mana: null,
      banishableCardId: null
    });
}

function createTowerSequence(boss: BossCard): string[] {
  const normalTowers = towerDefinitions.filter((tower) => !tower.id.startsWith('boss-tower-'));
  const normalTowerCount = boss.normalTowerCount ?? 1;
  const normalTowerIds = shuffle(normalTowers.map((t) => t.id)).slice(0, normalTowerCount);
  const bossTower = getTower(boss.bossTowerId ?? '') ?? towerDefinitions.find((tower) => tower.id.startsWith('boss-tower-')) ?? normalTowers[0];
  return [...normalTowerIds, bossTower.id];
}

export * from './data-access';
export * from './movement';
export * from './combat';
export * from './cards';
export * from './cells';
export * from './boss-combat';
export * from './utils';
