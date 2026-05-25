import { baseActions } from '../data/baseSet';
import type { GameState } from './types';
import { getAction, canFlipCard, flipCard } from './data-access';
import { addLog, rollDie, shuffle } from './utils';

const HAND_SIZE = 5;
const UPGRADE_XP_COST = 1;
const ADVANCED_ACTION_XP_COST = 2;
const POTION_XP_COST = 3;
const REROLL_XP_COST = 1;
const BANISH_XP_COST = 1;
const MAX_POTIONS = 3;

export function canUpgradeCard(state: GameState, cardId: string): boolean {
  if (state.phase === 'game-over' || state.phase === 'victory') return false;
  if (!state.hand.includes(cardId)) return false;
  const card = getAction(cardId);
  if (!card) return false;
  return canFlipCard(cardId, state.flippedCards) && state.xp >= UPGRADE_XP_COST;
}

export function upgradeCard(state: GameState, cardId: string): GameState {
  if (!canUpgradeCard(state, cardId)) {
    return addLog(state, 'Amelioration impossible dans cette situation.');
  }
  const card = getAction(cardId);
  if (!card) return state;
  return addLog(
    flipCard({ ...state, xp: state.xp - UPGRADE_XP_COST, manaJustRolled: false }, cardId),
    `Carte amelioree (face 2). -${UPGRADE_XP_COST} XP.`
  );
}

const ACTION_DECK_SIZE = 16;

export function createActionDeck(): string[] {
  const actionIds = baseActions.filter((card) => card.kind === 'action').map((card) => card.id);
  return Array.from({ length: ACTION_DECK_SIZE }, (_, index) => actionIds[index % actionIds.length]);
}

export function refillActionDeckIfEmpty(state: GameState): GameState {
  if (state.deck.length > 0 || state.discard.length === 0) return state;

  return addLog(
    {
      ...state,
      deck: shuffle(state.discard),
      discard: []
    },
    'Deck action vide : defausse melangee pour reformer le deck action.'
  );
}

export function drawCards(state: GameState): GameState {
  let deck = [...state.deck];
  let discard = [...state.discard];
  const hand = [...state.hand];

  while (hand.length < HAND_SIZE && (deck.length > 0 || discard.length > 0)) {
    if (deck.length === 0) {
      deck = shuffle(discard);
      discard = [];
    }

    const nextCard = deck.shift();
    if (nextCard) {
      hand.push(nextCard);
    }
  }

  return { ...state, deck, discard, hand };
}

export function drawOneActionCard(state: GameState, source: string, successLabel = 'piochee et ajoutee a la main'): GameState {
  if (state.hand.length >= HAND_SIZE) {
    return addLog(state, `${source} : main pleine, pioche interdite.`);
  }

  let deck = [...state.deck];
  let discard = [...state.discard];
  let reshuffled = false;
  if (deck.length === 0 && discard.length > 0) {
    deck = shuffle(discard);
    discard = [];
    reshuffled = true;
  }

  const [cardId, ...remainingDeck] = deck;
  const card = cardId ? getAction(cardId) : undefined;
  if (!cardId || !card) {
    return addLog(state, `${source} : deck action vide et defausse vide.`);
  }

  return refillActionDeckIfEmpty(addLog(
    {
      ...state,
      deck: remainingDeck,
      discard,
      hand: [...state.hand, cardId]
    },
    `${source} : carte ${successLabel}.${reshuffled ? ' Defausse melangee pour reformer le deck action.' : ''}`
  ));
}

export function drawActionCards(state: GameState, amount: number, source: string): GameState {
  let nextState = state;
  for (let index = 0; index < amount; index += 1) {
    nextState = drawOneActionCard(nextState, source);
    if (nextState.hand.length >= HAND_SIZE || (nextState.deck.length === 0 && nextState.discard.length === 0)) {
      break;
    }
  }

  return nextState;
}

export function buyTopActionCard(state: GameState): GameState {
  if (!state.activeCombat || state.mana === null || state.combatFeedback) {
    return addLog(state, 'Lance la mana avant d acheter une carte action.');
  }

  if (state.activeCombat.phase !== 'player') {
    return addLog(state, 'Une carte action ne peut etre achetee que pendant la phase joueuse.');
  }

  if (state.mana < 1) {
    return addLog(state, 'Mana insuffisante pour acheter une carte action.');
  }

  if (state.hand.length >= HAND_SIZE) {
    return addLog(state, 'Main pleine : impossible d acheter une carte action.');
  }

  if (state.deck.length === 0 && state.discard.length > 0) {
    return refillActionDeckIfEmpty(state);
  }

  if (state.deck.length === 0 && state.discard.length === 0) {
    return addLog(state, 'Deck action et defausse vides : impossible d acheter une carte action.');
  }

  return drawOneActionCard({ ...state, mana: state.mana - 1, manaJustRolled: false }, 'Achat action', 'achetee pour 1 mana et ajoutee a la main');
}

export function buyAdvancedActionCard(state: GameState, deckIndex: 0 | 1): GameState {
  if (state.phase === 'game-over' || state.phase === 'victory') {
    return state;
  }

  if (state.combatFeedback) {
    return addLog(state, 'Attends la fin de la resolution de combat pour acheter une carte AA.');
  }

  if (state.xp < ADVANCED_ACTION_XP_COST) {
    return addLog(state, 'XP insuffisante pour recuperer une carte AA.');
  }

  if (state.hand.length >= HAND_SIZE) {
    return addLog(state, 'Main pleine : impossible de recuperer une carte AA.');
  }

  const deck = state.advancedDecks[deckIndex];
  const cardId = deck[0];
  if (!cardId) {
    return addLog(state, 'Deck AA vide.');
  }

  const advancedDecks: [string[], string[]] = [...state.advancedDecks] as [string[], string[]];
  advancedDecks[deckIndex] = deck.slice(1);
  return addLog(
    {
      ...state,
      xp: state.xp - ADVANCED_ACTION_XP_COST,
      advancedDecks,
      hand: [...state.hand, cardId]
    },
    `Carte AA recuperee depuis le deck ${deckIndex + 1}. -${ADVANCED_ACTION_XP_COST} XP.`
  );
}

export function buyPotionWithXp(state: GameState): GameState {
  if (state.phase === 'game-over' || state.phase === 'victory') return state;
  if (state.xp < POTION_XP_COST) return addLog(state, 'XP insuffisante pour acheter une potion.');
  if (state.potions >= MAX_POTIONS) return addLog(state, 'Maximum de 3 potions deja atteint.');
  return addLog(
    { ...state, xp: state.xp - POTION_XP_COST, potions: state.potions + 1 },
    `Potion gagnee. -${POTION_XP_COST} XP.`
  );
}

export function rerollManaWithXp(state: GameState): GameState {
  const inCombatPlayerPhase = (state.activeCombat?.phase === 'player' && !state.combatFeedback)
    || (state.activeBossCombat?.phase === 'player' && !state.bossCombatFeedback);
  if (!inCombatPlayerPhase || state.mana === null) {
    return addLog(state, 'Relance de mana impossible maintenant.');
  }

  if (state.xp < REROLL_XP_COST) return addLog(state, 'XP insuffisante pour relancer la mana.');
  const mana = rollDie();
  return addLog({ ...state, xp: state.xp - REROLL_XP_COST, mana, manaJustRolled: false }, `Mana relancee : ${mana}. -${REROLL_XP_COST} XP.`);
}

export function rerollMovementDiceWithXp(state: GameState): GameState {
  if ((state.phase !== 'choose-destination' && state.phase !== 'choose-path') || !state.movementDice || state.activeCombat) {
    return addLog(state, 'Relance des des de deplacement impossible maintenant.');
  }

  if (state.xp < REROLL_XP_COST) return addLog(state, 'XP insuffisante pour relancer les des de deplacement.');
  const movementDice: [number, number] = [rollDie(), rollDie()];
  return addLog(
    {
      ...state,
      xp: state.xp - REROLL_XP_COST,
      movementDice,
      selectedMovement: null,
      pendingMovementPaths: [],
      selectedMovementPathIndex: null,
      phase: 'choose-destination'
    },
    `Des de deplacement relances : ${movementDice[0]} et ${movementDice[1]}. -${REROLL_XP_COST} XP.`
  );
}

export function canBanishPlayedCard(state: GameState): boolean {
  const inPlayerPhase =
    (state.activeCombat && (state.activeCombat.phase === 'player' || Boolean(state.combatFeedback)))
    || (state.activeBossCombat && (state.activeBossCombat.phase === 'player' || Boolean(state.bossCombatFeedback)));
  return Boolean(
    state.banishableCardId
    && inPlayerPhase
    && state.xp >= BANISH_XP_COST
    && state.discard.includes(state.banishableCardId)
    && state.phase !== 'game-over'
    && state.phase !== 'victory'
  );
}

export function banishPlayedCardWithXp(state: GameState): GameState {
  if (!canBanishPlayedCard(state) || !state.banishableCardId) {
    return addLog(state, 'Aucune carte jouee ne peut etre bannie maintenant.');
  }

  const banishedCard = getAction(state.banishableCardId);
  let removed = false;
  const discard = state.discard.filter((cardId) => {
    if (!removed && cardId === state.banishableCardId) {
      removed = true;
      return false;
    }
    return true;
  });

  return addLog(
    { ...state, xp: state.xp - BANISH_XP_COST, manaJustRolled: false, discard, banishableCardId: null },
    `${banishedCard?.text ?? 'Carte jouee'} bannie. -${BANISH_XP_COST} XP.`
  );
}

export function discardHandCardForMana(state: GameState, handIndex: number): GameState {
  if (!state.activeCombat && !state.activeBossCombat) {
    return addLog(state, 'Aucun combat actif.');
  }

  if (state.combatFeedback || state.bossCombatFeedback) {
    return state;
  }

  if (!state.manaJustRolled || state.mana === null) {
    return addLog(state, 'Défausse pour mana possible seulement au début du round, juste après le lancer de mana.');
  }

  if (state.mana >= 6) {
    return addLog(state, 'Le de Mana ne peut pas depasser 6.');
  }

  const cardId = state.hand[handIndex];
  const card = cardId ? getAction(cardId) : undefined;
  if (!cardId || !card) {
    return addLog(state, 'Aucune carte valide a defausser pour la mana.');
  }

  return addLog(
    {
      ...state,
      mana: Math.min(6, state.mana + 1),
      manaJustRolled: false,
      hand: state.hand.filter((_, index) => index !== handIndex),
      discard: [...state.discard, cardId]
    },
    'Carte defaussee : +1 mana pour ce round.'
  );
}

export function cycleAdvancedDeckCard(state: GameState, deckIndex: 0 | 1): GameState {
  const inCombatPlayerPhase =
    (state.activeCombat?.phase === 'player' && !state.combatFeedback)
    || (state.activeBossCombat?.phase === 'player' && !state.bossCombatFeedback);

  if (!inCombatPlayerPhase || state.mana === null) {
    return addLog(state, 'Action impossible dans cette situation.');
  }

  if (state.mana < 1) {
    return addLog(state, 'Mana insuffisante pour passer la carte du deck AA.');
  }

  const deck = state.advancedDecks[deckIndex];
  if (deck.length === 0) {
    return addLog(state, 'Deck AA vide.');
  }

  const [top, ...rest] = deck;
  const advancedDecks: [string[], string[]] = [...state.advancedDecks] as [string[], string[]];
  advancedDecks[deckIndex] = [...rest, top];

  return addLog(
    { ...state, mana: state.mana - 1, manaJustRolled: false, advancedDecks },
    `Carte du deck AA ${deckIndex + 1} passée sous le deck. -1◆`
  );
}
