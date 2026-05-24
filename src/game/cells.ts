import { baseEnemies } from '../data/baseSet';
import type { GameState, PendingCombatGroup, TowerCell } from './types';
import { getAction, getBoss, getCell, getEnemy, getTower } from './data-access';
import { resolveCardForDisplay } from './data-access';
import { initBossCombat } from './boss-combat';
import { applyDamageToHealth } from './health';
import { addLog, rollDie, shuffle } from './utils';

const TOWER_SEQUENCE_LIMIT = 3;
const MAX_POTIONS = 3;
const STARTING_HAND_SIZE = 5;

export function rollPendingCellResolution(state: GameState): GameState {
  if (!state.pendingCellRoll) {
    return state;
  }

  const pendingRoll = state.pendingCellRoll;
  const cell = getCell(state, pendingRoll.cellId);
  if (!cell) {
    return continuePendingResolution({ ...state, pendingCellRoll: null });
  }

  const resolvedState =
    pendingRoll.kind === 'trap' ? resolveTrap(state, cell) :
    pendingRoll.kind === 'trap-advanced' ? resolveTrapAdvanced(state, cell) :
    pendingRoll.kind === 'treasure-advanced' ? resolveTreasureAdvanced(state, cell) :
    resolveTreasure(state, cell);

  if (resolvedState.phase === 'game-over') {
    return { ...resolvedState, pendingCellRoll: null };
  }

  if (resolvedState.trapFeedback || resolvedState.treasureFeedback) {
    return { ...resolvedState, pendingCellRoll: null };
  }

  if (resolvedState.pendingTrapLevelDiscard || resolvedState.pendingTreasureChoice) {
    return { ...resolvedState, pendingCellRoll: null };
  }

  return continuePendingResolution({ ...resolvedState, pendingCellRoll: null });
}

export function resolveCrossedCells(state: GameState, crossedCells: TowerCell[]): GameState {
  const unresolvedCells = crossedCells.filter((cell) => !state.resolvedCells.includes(cell.id));
  const resolvedCells = Array.from(new Set([...state.resolvedCells, ...unresolvedCells.map((cell) => cell.id)]));
  let nextState: GameState = { ...state, resolvedCells };

  const enemyCount = unresolvedCells.reduce((total, cell) => total + (cell.kind === 'enemy' ? cell.enemyCount ?? 1 : 0), 0);
  const pendingTraps = unresolvedCells.filter((cell) => cell.kind === 'trap' || cell.kind === 'trap-advanced').map((cell) => cell.id);
  const pendingCombatGroups = createCombatGroups(enemyCount);
  const pendingTreasures = unresolvedCells.filter((cell) => cell.kind === 'treasure' || cell.kind === 'treasure-advanced').map((cell) => cell.id);
  const bossCell = unresolvedCells.find((cell) => cell.kind === 'boss' && cell.id === state.position);

  return continuePendingResolution({
    ...nextState,
    pendingTraps,
    pendingCombatGroups,
    pendingTreasures,
    pendingBossCellId: bossCell?.id ?? null
  });
}

export function continuePendingResolution(state: GameState): GameState {
  if (state.pendingCellRoll) {
    return state;
  }

  if (state.pendingTraps.length > 0) {
    const [nextTrapCellId, ...remainingTraps] = state.pendingTraps;
    const trap = getCell(state, nextTrapCellId);
    const trapKind: 'trap' | 'trap-advanced' = trap?.kind === 'trap-advanced' ? 'trap-advanced' : 'trap';
    return addLog(
      {
        ...state,
        pendingTraps: remainingTraps,
        pendingCellRoll: { kind: trapKind, cellId: nextTrapCellId },
        phase: 'movement-roll'
      },
      `${trap?.label ?? 'Piege'} : lance le de pour resoudre le ${trapKind === 'trap-advanced' ? 'piege avance' : 'piege'}.`
    );
  }

  if (state.pendingCombatGroups.length > 0) {
    const [nextCombatGroup, ...remainingCombatGroups] = state.pendingCombatGroups;
    const resolvedEnemies = nextCombatGroup.enemyIds.map((enemyId, index) => {
      const enemy = getEnemy(enemyId);
      const h = enemy?.health;
      const atk = enemy?.attack;
      return {
        instanceId: `${enemyId}-${Date.now()}-${index}`,
        enemyId,
        enemyHealth: h === '?' ? rollDie() : (h === null || h === undefined) ? 1 : h,
        resolvedAttack: atk === '?' ? rollDie() : (atk === null || atk === undefined) ? 0 : atk
      };
    });
    const questionRolls = resolvedEnemies
      .map((re, i) => {
        const enemy = getEnemy(re.enemyId);
        const h = enemy?.health;
        const atk = enemy?.attack;
        const parts: string[] = [];
        if (h === '?') parts.push(`PV→${re.enemyHealth}`);
        if (atk === '?') parts.push(`ATQ→${re.resolvedAttack}`);
        return parts.length > 0 ? `[${re.enemyId} ${parts.join(' ')}]` : null;
      })
      .filter(Boolean)
      .join(' ');
    const combatLog = `Combat contre ${nextCombatGroup.enemyIds.length} ennemi(s). Lance la mana.${questionRolls ? ` ? tirés : ${questionRolls}` : ''}`;
    return addLog(
      {
        ...state,
        activeCombat: {
          round: 1,
          defense: 0,
          phase: 'roll-mana',
          pendingHits: [],
          enemies: resolvedEnemies
        },
        combatFeedback: null,
        pendingCombatGroups: remainingCombatGroups,
        phase: 'movement-roll'
      },
      combatLog
    );
  }

  if (state.pendingTreasures.length > 0) {
    const [nextTreasureCellId, ...remainingTreasures] = state.pendingTreasures;
    const treasure = getCell(state, nextTreasureCellId);
    const treasureKind: 'treasure' | 'treasure-advanced' = treasure?.kind === 'treasure-advanced' ? 'treasure-advanced' : 'treasure';
    return addLog(
      {
        ...state,
        pendingTreasures: remainingTreasures,
        pendingCellRoll: { kind: treasureKind, cellId: nextTreasureCellId },
        phase: 'movement-roll'
      },
      `${treasure?.label ?? 'Tresor'} : lance le de pour resoudre le ${treasureKind === 'treasure-advanced' ? 'tresor avance' : 'tresor'}.`
    );
  }

  if (state.pendingBossCellId) {
    const boss = getCell(state, state.pendingBossCellId);
    if (boss) {
      const nextState = resolveCell(state, boss);
      return completeMovementSequence({
        ...nextState,
        pendingTraps: [],
        pendingTreasures: [],
        pendingBossCellId: null,
        phase: nextState.phase === 'victory' ? 'victory' : 'movement-roll'
      });
    }
  }

  return completeMovementSequence({
    ...state,
    pendingTraps: [],
    pendingTreasures: [],
    pendingBossCellId: null,
    phase: state.phase === 'victory' ? 'victory' : 'movement-roll'
  });
}

export function completeMovementSequence(state: GameState): GameState {
  if (state.phase === 'victory' || state.phase === 'game-over' || state.activeCombat || state.activeBossCombat) {
    return state;
  }

  const towerSequenceCount = state.towerSequenceCount + 1;
  const nextTowerId = state.towerIds[state.currentTowerIndex + 1];

  if (towerSequenceCount < TOWER_SEQUENCE_LIMIT) {
    return addLog(
      { ...state, towerSequenceCount },
      `Sequence ${towerSequenceCount}/${TOWER_SEQUENCE_LIMIT} de cette tour terminee.`
    );
  }

  if (!nextTowerId) {
    return addLog(
      { ...state, towerSequenceCount, phase: 'game-over' },
      'Troisieme sequence terminee sans atteindre la case Boss. Defaite !'
    );
  }

  const nextTower = getTower(nextTowerId);
  if (!nextTower) {
    return { ...state, towerSequenceCount };
  }

  return addLog(
    {
      ...state,
      towerId: nextTower.id,
      currentTowerIndex: state.currentTowerIndex + 1,
      currentFloor: state.currentTowerIndex + 2,
      towerSequenceCount: 0,
      position: nextTower.startingCellId,
      movementDice: null,
      selectedMovement: null,
      pendingMovementPaths: [],
      selectedMovementPathIndex: null,
      resolvedCells: [...state.resolvedCells, nextTower.startingCellId],
      phase: 'movement-roll'
    },
    `Troisieme sequence terminee. Acces direct a l'entree de ${nextTower.name}.`
  );
}

function createCombatGroups(enemyCount: number): PendingCombatGroup[] {
  const enemyIds = Array.from({ length: enemyCount }, () => pickRandomEnemyId());
  const groups: PendingCombatGroup[] = [];

  for (let index = 0; index < enemyIds.length; index += 3) {
    groups.push({ enemyIds: enemyIds.slice(index, index + 3) });
  }

  return groups;
}

function pickRandomEnemyId(): string {
  return baseEnemies[Math.floor(Math.random() * baseEnemies.length)]?.id ?? 'enemy-garde';
}

function resolveCell(state: GameState, cell: TowerCell): GameState {
  if (cell.kind === 'empty') {
    return markCellResolved(addLog(state, `${cell.label} : rien a resoudre.`), cell.id);
  }

  if (cell.kind === 'trap') {
    return resolveTrap(state, cell);
  }

  if (cell.kind === 'trap-advanced') {
    return resolveTrapAdvanced(state, cell);
  }

  if (cell.kind === 'treasure') {
    return resolveTreasure(state, cell);
  }

  if (cell.kind === 'treasure-advanced') {
    return resolveTreasureAdvanced(state, cell);
  }

  if (cell.kind === 'enemy') {
    return state;
  }

  if (cell.kind === 'boss') {
    return initBossCombat({ ...state, resolvedCells: [...state.resolvedCells, cell.id] });
  }

  return state;
}

function markCellResolved(state: GameState, cellId: string): GameState {
  return state.resolvedCells.includes(cellId) ? state : { ...state, resolvedCells: [...state.resolvedCells, cellId] };
}

function resolveTrap(state: GameState, cell: TowerCell): GameState {
  const roll = rollDie();

  if (roll >= 1 && roll <= 3) {
    return startTrapLevelDiscard(state, cell, roll + 3, roll);
  }

  if (roll === 4) {
    const next = applyDamage(state, 1, `${cell.label} : piege ${roll}.`);
    return { ...next, trapFeedback: { dieResult: roll, damage: 1, consequence: 'direct-damage' } };
  }

  if (roll === 5) {
    if (state.hand.length === 0) {
      const next = addLog(state, `${cell.label} : piege ${roll}. Aucune carte en main a defausser.`);
      return { ...next, trapFeedback: { dieResult: roll, damage: 0, consequence: 'no-effect' } };
    }
    const discardIndex = Math.floor(Math.random() * state.hand.length);
    const discardedCard = state.hand[discardIndex];
    const next = addLog(state, `${cell.label} : piege ${roll}. Une carte aleatoire de la main est defaussee.`);
    return { ...next, trapFeedback: { dieResult: roll, damage: 0, consequence: 'discard-hand', discardedCardId: discardedCard } };
  }

  const discardedCards = state.deck.slice(0, 5);
  if (discardedCards.length === 0) {
    const next = addLog(state, `${cell.label} : piege ${roll}. Le deck action est deja vide.`);
    return { ...next, trapFeedback: { dieResult: roll, damage: 0, consequence: 'no-effect' } };
  }
  const next = addLog(
    {
      ...state,
      deck: state.deck.slice(5),
      discard: [...state.discard, ...discardedCards]
    },
    `${cell.label} : piege ${roll}. ${discardedCards.length} carte(s) du deck action defaussee(s).`
  );
  return { ...next, trapFeedback: { dieResult: roll, damage: 0, cardsDiscarded: discardedCards.length, consequence: 'discard-deck' } };
}

function startTrapLevelDiscard(state: GameState, cell: TowerCell, level: number, trapRoll: number): GameState {
  return addLog(
    { ...state, pendingTrapLevelDiscard: { level, dieResult: trapRoll, cellLabel: cell.label, manaBonus: 0, discardedForBonus: [] } },
    `${cell.label} : piège de niveau ${level}. Défausse des cartes pour augmenter ton jet de protection, puis lance le dé.`
  );
}

export function clearTrapFeedback(state: GameState): GameState {
  const feedback = state.trapFeedback;
  let next = { ...state, trapFeedback: null };
  if (feedback?.consequence === 'discard-hand' && feedback.discardedCardId) {
    const cardId = feedback.discardedCardId;
    next = {
      ...next,
      hand: next.hand.filter((id) => id !== cardId),
      discard: [...next.discard, cardId],
    };
  }
  return continuePendingResolution(next);
}

export function clearTreasureFeedback(state: GameState): GameState {
  return continuePendingResolution({ ...state, treasureFeedback: null });
}

export function discardCardForTrapBonus(state: GameState, handIndex: number): GameState {
  const pending = state.pendingTrapLevelDiscard;
  if (!pending) return state;
  const cardId = state.hand[handIndex];
  if (!cardId) return state;
  const cardRaw = getAction(cardId);
  if (!cardRaw) return state;
  const card = resolveCardForDisplay(cardRaw, state.flippedCards);
  const manaCost = card.manaCost ?? 0;
  return addLog(
    {
      ...state,
      hand: state.hand.filter((_, i) => i !== handIndex),
      discard: [...state.discard, cardId],
      pendingTrapLevelDiscard: {
        ...pending,
        manaBonus: pending.manaBonus + manaCost,
        discardedForBonus: [...pending.discardedForBonus, cardId]
      }
    },
    `Défausse de ${card.text} (coût ${manaCost} mana) pour le jet de protection. Bonus actuel : +${pending.manaBonus + manaCost}.`
  );
}

export function undoTrapDiscard(state: GameState): GameState {
  const pending = state.pendingTrapLevelDiscard;
  if (!pending || pending.discardedForBonus.length === 0) return state;
  const cardId = pending.discardedForBonus[pending.discardedForBonus.length - 1];
  const cardRaw = getAction(cardId);
  const card = cardRaw ? resolveCardForDisplay(cardRaw, state.flippedCards) : null;
  const manaCost = card?.manaCost ?? 0;
  const lastIdx = state.discard.lastIndexOf(cardId);
  const newDiscard = lastIdx === -1 ? state.discard : state.discard.filter((_, i) => i !== lastIdx);
  return addLog(
    {
      ...state,
      hand: [...state.hand, cardId],
      discard: newDiscard,
      pendingTrapLevelDiscard: {
        ...pending,
        manaBonus: pending.manaBonus - manaCost,
        discardedForBonus: pending.discardedForBonus.slice(0, -1),
      }
    },
    `Annulation : ${card?.text ?? cardId} remise en main. Bonus : +${pending.manaBonus - manaCost}.`
  );
}

export function resolveTrapLevelWithBonus(state: GameState): GameState {
  const pending = state.pendingTrapLevelDiscard;
  if (!pending) return state;
  const defenseRoll = rollDie();
  const effective = defenseRoll + pending.manaBonus;
  const damage = Math.max(0, pending.level - effective);
  const next = applyDamage(
    { ...state, pendingTrapLevelDiscard: null },
    damage,
    `${pending.cellLabel} : piège niveau ${pending.level}. Jet ${defenseRoll} + bonus ${pending.manaBonus} = ${effective}`
  );
  const trapFeedback = {
    dieResult: pending.dieResult,
    trapLevel: pending.level,
    defenseRoll,
    manaBonus: pending.manaBonus,
    damage,
    consequence: 'level-trap' as const
  };
  if (next.phase === 'game-over') return { ...next, trapFeedback };
  return { ...next, trapFeedback };
}

export function chooseTreasureCard(state: GameState, cardId: string): GameState {
  const pending = state.pendingTreasureChoice;
  if (!pending) return state;
  if (state.hand.length >= STARTING_HAND_SIZE) return addLog(state, 'Main pleine : impossible de recuperer une carte de tresor.');

  const { source, dieResult, cellLabel } = pending;
  const pile = source === 'deck' ? state.deck : state.discard;
  if (!pile.includes(cardId)) return state;
  const newPile = removeFirst(pile, cardId);
  const remaining = Math.max(0, pending.remaining - 1);
  const nextCandidates = removeFirst(pending.candidates, cardId).filter((candidateId) => newPile.includes(candidateId));
  const newState = source === 'deck'
    ? { ...state, deck: newPile }
    : { ...state, discard: newPile };

  if (remaining > 0 && nextCandidates.length > 0 && newState.hand.length + 1 < STARTING_HAND_SIZE) {
    return addLog(
      {
        ...newState,
        hand: [...state.hand, cardId],
        pendingTreasureChoice: { ...pending, candidates: nextCandidates, remaining }
      },
      `${cellLabel} : tresor ${dieResult}. Carte recuperee, choisis encore ${remaining} carte(s).`
    );
  }

  const finalDeck = source === 'deck' && pending.shuffleAfterChoice ? shuffle(newPile) : newState.deck;
  const next = addLog(
    { ...newState, deck: finalDeck, hand: [...state.hand, cardId], pendingTreasureChoice: null },
    `${cellLabel} : tresor ${dieResult}. Carte(s) recuperee(s) depuis ${source === 'deck' ? 'le deck action' : 'la defausse action'}.${source === 'deck' && pending.shuffleAfterChoice ? ' Deck action melange.' : ''}`
  );
  const treasureFeedback = {
    dieResult,
    consequence: (source === 'deck' ? 'card-from-deck' : 'card-from-discard') as 'card-from-deck' | 'card-from-discard',
    cardId,
    cardsRecovered: pending.remaining - remaining
  };
  return continuePendingResolution({ ...next, treasureFeedback });
}

function applyDamage(state: GameState, damage: number, source: string): GameState {
  if (damage <= 0) {
    return addLog(state, `${source}. Aucun degat.`);
  }

  const { health, healthLimit } = applyDamageToHealth(state.health, state.healthLimit, damage);
  const nextState = addLog({ ...state, health, healthLimit }, `${source} -${damage} PV.`);
  return health <= 0
    ? addLog({ ...nextState, health: 0, phase: 'game-over' }, 'Defaite. La partie est terminee.')
    : nextState;
}

function removeFirst(cards: string[], cardId: string): string[] {
  let removed = false;
  return cards.filter((id) => {
    if (!removed && id === cardId) {
      removed = true;
      return false;
    }
    return true;
  });
}

function resolveTrapAdvanced(state: GameState, cell: TowerCell): GameState {
  const roll = rollDie();

  if (roll === 1) return startTrapLevelDiscard(state, cell, 5, roll);
  if (roll === 2) return startTrapLevelDiscard(state, cell, 6, roll);
  if (roll === 3) return startTrapLevelDiscard(state, cell, 8, roll);

  if (roll === 4) {
    const next = applyDamage(state, 4, `${cell.label} : piege avance ${roll}.`);
    return { ...next, trapFeedback: { dieResult: roll, damage: 4, consequence: 'direct-damage' } };
  }

  if (roll === 5) {
    const advancedCardIds = state.hand.filter((cardId) => getAction(cardId)?.kind === 'advanced-action');
    if (advancedCardIds.length === 0) {
      const next = addLog(state, `${cell.label} : piege avance ${roll}. Aucune carte action avancee en main.`);
      return { ...next, trapFeedback: { dieResult: roll, damage: 0, consequence: 'no-effect' } };
    }
    const next = addLog(
      {
        ...state,
        hand: state.hand.filter((cardId) => !advancedCardIds.includes(cardId)),
        discard: [...state.discard, ...advancedCardIds]
      },
      `${cell.label} : piege avance ${roll}. ${advancedCardIds.length} carte(s) action avancee(s) defaussee(s).`
    );
    return { ...next, trapFeedback: { dieResult: roll, damage: 0, cardsDiscarded: advancedCardIds.length, consequence: 'discard-hand-advanced' } };
  }

  if (state.hand.length === 0) {
    const next = addLog(state, `${cell.label} : piege avance ${roll}. Aucune carte en main.`);
    return { ...next, trapFeedback: { dieResult: roll, damage: 0, consequence: 'no-effect' } };
  }
  const next = addLog(
    { ...state, discard: [...state.discard, ...state.hand], hand: [] },
    `${cell.label} : piege avance ${roll}. Toutes les cartes de la main defaussees.`
  );
  return { ...next, trapFeedback: { dieResult: roll, damage: 0, cardsDiscarded: state.hand.length, consequence: 'discard-hand-all' } };
}

function resolveTreasure(state: GameState, cell: TowerCell): GameState {
  const roll = rollDie();

  if (roll === 1) {
    if (state.deck.length === 0) {
      const next = addLog(state, `${cell.label} : tresor ${roll}. Aucune carte disponible dans le deck action.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    if (state.hand.length >= STARTING_HAND_SIZE) {
      const next = addLog(state, `${cell.label} : tresor ${roll}. Main pleine, aucune carte recuperee.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    return addLog(
      { ...state, pendingTreasureChoice: { source: 'deck', candidates: [...state.deck], dieResult: roll, cellLabel: cell.label, remaining: 1, shuffleAfterChoice: true } },
      `${cell.label} : tresor ${roll}. Choisis une carte a recuperer depuis le deck action.`
    );
  }

  if (roll === 2) {
    if (state.discard.length === 0) {
      const next = addLog(state, `${cell.label} : tresor ${roll}. Aucune carte disponible dans la defausse action.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    if (state.hand.length >= STARTING_HAND_SIZE) {
      const next = addLog(state, `${cell.label} : tresor ${roll}. Main pleine, aucune carte recuperee.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    return addLog(
      { ...state, pendingTreasureChoice: { source: 'discard', candidates: [...state.discard], dieResult: roll, cellLabel: cell.label, remaining: 1 } },
      `${cell.label} : tresor ${roll}. Choisis une carte a recuperer depuis la defausse action.`
    );
  }

  if (roll === 3) {
    const next = addLog({ ...state, xp: state.xp + 1 }, `${cell.label} : tresor ${roll}. +1 XP.`);
    return { ...next, treasureFeedback: { dieResult: roll, consequence: 'xp', xpGained: 1 } };
  }

  if (roll === 4) {
    const next = addLog({ ...state, xp: state.xp + 2 }, `${cell.label} : tresor ${roll}. +2 XP.`);
    return { ...next, treasureFeedback: { dieResult: roll, consequence: 'xp', xpGained: 2 } };
  }

  const potionsGained = Math.min(1, MAX_POTIONS - state.potions);
  const next = addLog(
    { ...state, potions: Math.min(MAX_POTIONS, state.potions + potionsGained) },
    `${cell.label} : tresor ${roll}. +${potionsGained} potion(s) de vie.`
  );
  return { ...next, treasureFeedback: { dieResult: roll, consequence: 'potion', potionsGained } };
}

function resolveTreasureAdvanced(state: GameState, cell: TowerCell): GameState {
  const roll = rollDie();

  if (roll === 1) {
    const candidates = state.deck.slice(0, 2);
    if (candidates.length === 0) {
      const next = addLog(state, `${cell.label} : tresor avance ${roll}. Deck action vide.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    const recoverable = Math.min(candidates.length, STARTING_HAND_SIZE - state.hand.length);
    if (recoverable === 0) {
      const next = addLog(state, `${cell.label} : tresor avance ${roll}. Main pleine.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    return addLog(
      { ...state, pendingTreasureChoice: { source: 'deck', candidates, dieResult: roll, cellLabel: cell.label, remaining: recoverable } },
      `${cell.label} : tresor avance ${roll}. Choisis ${recoverable} carte(s) parmi les 2 premieres du deck action.`
    );
  }

  if (roll === 2) {
    const candidates = state.discard.slice(0, 2);
    if (candidates.length === 0) {
      const next = addLog(state, `${cell.label} : tresor avance ${roll}. Defausse action vide.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    const recoverable = Math.min(candidates.length, STARTING_HAND_SIZE - state.hand.length);
    if (recoverable === 0) {
      const next = addLog(state, `${cell.label} : tresor avance ${roll}. Main pleine.`);
      return { ...next, treasureFeedback: { dieResult: roll, consequence: 'no-effect' } };
    }
    return addLog(
      { ...state, pendingTreasureChoice: { source: 'discard', candidates, dieResult: roll, cellLabel: cell.label, remaining: recoverable } },
      `${cell.label} : tresor avance ${roll}. Choisis ${recoverable} carte(s) parmi les 2 premieres de la defausse action.`
    );
  }

  if (roll === 3) {
    const next = addLog({ ...state, xp: state.xp + 2 }, `${cell.label} : tresor avance ${roll}. +2 XP.`);
    return { ...next, treasureFeedback: { dieResult: roll, consequence: 'xp', xpGained: 2 } };
  }

  if (roll === 4) {
    const next = addLog({ ...state, xp: state.xp + 3 }, `${cell.label} : tresor avance ${roll}. +3 XP.`);
    return { ...next, treasureFeedback: { dieResult: roll, consequence: 'xp', xpGained: 3 } };
  }

  if (roll === 5) {
    const next = addLog(
      { ...state, potions: Math.min(MAX_POTIONS, state.potions + 1) },
      `${cell.label} : tresor avance ${roll}. +1 potion de vie.`
    );
    return { ...next, treasureFeedback: { dieResult: roll, consequence: 'potion', potionsGained: 1 } };
  }

  const potionsGained = Math.min(2, MAX_POTIONS - state.potions);
  const next = addLog(
    { ...state, potions: Math.min(MAX_POTIONS, state.potions + 2) },
    `${cell.label} : tresor avance ${roll}. +${potionsGained} potion(s) de vie.`
  );
  return { ...next, treasureFeedback: { dieResult: roll, consequence: 'potion', potionsGained } };
}
