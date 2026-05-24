import type { ActiveBossCombat, BossCombatFeedback, CardFaceData, GameState } from './types';
import { getAction, getActiveCardFace, getBoss } from './data-access';
import { drawActionCards } from './cards';
import { applyDamageToHealth, recoverHealth } from './health';
import { addLog, rollDie } from './utils';

export function rollBossMana(state: GameState): GameState {
  if (!state.activeBossCombat || state.bossCombatFeedback) return state;
  if (state.activeBossCombat.phase !== 'roll-mana') {
    return addLog(state, 'La mana ne peut être lancée qu\'au début de la phase joueuse.');
  }
  const mana = rollDie();
  return addLog(
    { ...state, mana, activeBossCombat: { ...state.activeBossCombat, phase: 'player' } },
    `Mana disponible : ${mana}. Phase joueuse.`
  );
}

export function playBossActionCard(state: GameState, cardId: string, targetDieIndex: number | null): GameState {
  if (!state.activeBossCombat || state.bossCombatFeedback) return state;
  if (state.activeBossCombat.phase !== 'player') {
    return addLog(state, 'Les cartes ne peuvent être jouées que pendant la phase joueuse.');
  }

  const card = getAction(cardId);
  const handIndex = state.hand.indexOf(cardId);
  if (!card || handIndex === -1) return state;

  const face = getActiveCardFace(card, state.flippedCards);
  const mana = state.mana ?? 0;
  if (face.manaCost === null) return addLog(state, 'Mana non renseignée pour cette carte.');
  if (mana < face.manaCost) return addLog(state, 'Mana insuffisante.');

  let nextState: GameState = {
    ...state,
    mana: mana - face.manaCost,
    hand: state.hand.filter((_, i) => i !== handIndex),
    discard: [...state.discard, cardId],
    banishableCardId: cardId,
  };

  return applyBossEffects(nextState, face, targetDieIndex);
}

function applyBossEffects(state: GameState, face: CardFaceData, targetDieIndex: number | null): GameState {
  if (!state.activeBossCombat) return state;
  let next = addLog(state, 'Carte jouée.');

  for (const effect of face.effects) {
    if (next.phase === 'game-over') break;
    if (effect.kind === 'damage') {
      next = applyBossDamage(next, effect.value, targetDieIndex);
    } else if (effect.kind === 'defense') {
      next = addLog(
        { ...next, activeBossCombat: { ...next.activeBossCombat!, defense: next.activeBossCombat!.defense + effect.value } },
        `+${effect.value} défense pour ce round.`
      );
    } else if (effect.kind === 'heal') {
      const before = next.health;
      const health = recoverHealth(before, next.healthLimit, effect.value);
      next = addLog({ ...next, health }, `Soin : +${health - before} PV.`);
    } else if (effect.kind === 'draw') {
      next = drawActionCards(next, effect.value, 'Carte');
    } else if (effect.kind === 'mana') {
      next = addLog({ ...next, mana: Math.min(6, (next.mana ?? 0) + effect.value) }, `+${effect.value} mana.`);
    } else if (effect.kind === 'reroll-mana') {
      const newMana = rollDie();
      next = addLog({ ...next, mana: newMana }, `Mana relancée → ${newMana}.`);
    } else if (effect.kind === 'self-damage') {
      const { health, healthLimit } = applyDamageToHealth(next.health, next.healthLimit, effect.value);
      next = addLog({ ...next, health, healthLimit }, `${effect.value} dégât subi.`);
      if (health <= 0) next = addLog({ ...next, phase: 'game-over' }, 'Défaite.');
    }
  }

  return next;
}

function applyBossDamage(state: GameState, damage: number, dieIndex: number | null): GameState {
  if (!state.activeBossCombat) return state;

  if (dieIndex === null) return addLog(state, 'Sélectionne un dé du boss à attaquer.');

  const dieValue = state.activeBossCombat.healthDice[dieIndex];
  if (dieValue === null) return addLog(state, 'Ce dé est déjà éliminé, choisis-en un autre.');

  const dieRemoved = damage >= dieValue;
  const newDice = state.activeBossCombat.healthDice.map((d, i) =>
    i === dieIndex ? (dieRemoved ? null : d) : d
  );

  const feedback: BossCombatFeedback = { dieIndex, damage, dieRemoved, gaugeCleared: false };
  const next: GameState = {
    ...state,
    activeBossCombat: { ...state.activeBossCombat, healthDice: newDice },
    bossCombatFeedback: feedback,
  };

  return dieRemoved
    ? addLog(next, `${damage} dégâts ! Dé ${dieValue} éliminé.`)
    : addLog(next, `${damage} dégâts insuffisants contre le dé ${dieValue}.`);
}

export function completeBossCombatFeedback(state: GameState): GameState {
  if (!state.activeBossCombat || !state.bossCombatFeedback) return state;

  const allRemoved = state.activeBossCombat.healthDice.every((d) => d === null);
  const next: GameState = { ...state, bossCombatFeedback: null };

  if (!allRemoved) return next;

  const boss = getBoss(state.bossId);
  const isX2 = (boss?.healthGaugeRepeats ?? 1) === 2;

  if (isX2 && state.activeBossCombat.gaugeIndex === 0) {
    const newDice = (boss!.healthDice as (number | '?')[]).map((v) => (v === '?' ? rollDie() : v));
    return addLog(
      {
        ...next,
        mana: null,
        activeBossCombat: {
          ...next.activeBossCombat!,
          healthDice: newDice,
          gaugeIndex: 1,
          round: 1,
          phase: 'roll-mana',
          defense: 0,
        },
      },
      `Première jauge éliminée ! ${boss!.name} repart avec une seconde jauge.`
    );
  }

  return addLog({ ...next, activeBossCombat: null, phase: 'victory' }, `${boss?.name ?? 'Boss'} vaincu ! Victoire !`);
}

export function endBossPlayerPhase(state: GameState): GameState {
  if (!state.activeBossCombat || state.bossCombatFeedback) return state;
  if (state.activeBossCombat.phase !== 'player') {
    return addLog(state, 'Lance d\'abord la mana avant de terminer la phase joueuse.');
  }
  return addLog(
    { ...state, banishableCardId: null, activeBossCombat: { ...state.activeBossCombat, phase: 'boss-attack' } },
    'Phase joueuse terminée. Résoudre l\'attaque du boss.'
  );
}

export function resolveBossAttack(state: GameState): GameState {
  if (!state.activeBossCombat || state.activeBossCombat.phase !== 'boss-attack') return state;

  const boss = getBoss(state.bossId);
  const bossAtk = boss?.attack ?? 0;
  const defense = state.activeBossCombat.defense;
  const net = Math.max(0, bossAtk - defense);
  const { health, healthLimit } = applyDamageToHealth(state.health, state.healthLimit, net);

  let next: GameState = addLog(
    {
      ...state,
      health,
      healthLimit,
      mana: null,
      banishableCardId: null,
      playerFeedback: { incomingDamage: bossAtk, blocked: defense, net },
      activeBossCombat: {
        ...state.activeBossCombat,
        round: state.activeBossCombat.round + 1,
        defense: 0,
        phase: 'roll-mana',
      },
    },
    `${boss?.name ?? 'Boss'} attaque : ${bossAtk} dégâts, ${defense} défense, -${net} PV. Round ${state.activeBossCombat.round + 1}.`
  );

  if (health <= 0) next = addLog({ ...next, health: 0, phase: 'game-over' }, 'Défaite. La partie est terminée.');

  return next;
}

export function initBossCombat(state: GameState): GameState {
  const boss = getBoss(state.bossId);
  if (!boss) return addLog(state, 'Boss introuvable.');

  const healthDice: (number | null)[] = boss.healthDice.map((v) => (v === '?' ? rollDie() : v));
  const bossCombat: ActiveBossCombat = {
    round: 1,
    phase: 'roll-mana',
    healthDice,
    gaugeIndex: 0,
    defense: 0,
  };

  return addLog(
    { ...state, activeBossCombat: bossCombat, bossCombatFeedback: null },
    `${boss.name} apparaît ! Lancez la mana pour commencer le combat.`
  );
}
