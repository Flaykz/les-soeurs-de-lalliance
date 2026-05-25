import type { ActionCard, ActiveCombat, CardFaceData, EnemyCard, GameState } from './types';
import { faceNeedsTarget, getAction, getActiveCardFace, getEnemy } from './data-access';
import { continuePendingResolution } from './cells';
import { drawActionCards } from './cards';
import { applyDamageToHealth, recoverHealth } from './health';
import { addLog, rollDie } from './utils';

function hasTrait(enemyId: string, trait: string, suppressedTraits?: string[]): boolean {
  if (suppressedTraits?.some((t) => t.toLowerCase() === trait.toLowerCase())) return false;
  const enemy = getEnemy(enemyId);
  return enemy?.traits?.some((t) => t.toLowerCase() === trait.toLowerCase()) ?? false;
}

function isValidCombatTarget(combat: ActiveCombat, targetInstanceId: string): boolean {
  const target = combat.enemies.find((e) => e.instanceId === targetInstanceId);
  if (!target || target.enemyHealth <= 0) return false;
  if (!hasTrait(target.enemyId, 'caché', target.suppressedTraits)) return true;
  return !combat.enemies.some(
    (e) => e.instanceId !== targetInstanceId && e.enemyHealth > 0 && !hasTrait(e.enemyId, 'caché', e.suppressedTraits)
  );
}

export function isCombatTargetUntargetable(combat: ActiveCombat, targetInstanceId: string): boolean {
  return !isValidCombatTarget(combat, targetInstanceId);
}

export function rollMana(state: GameState): GameState {
  if (!state.activeCombat || state.combatFeedback || state.phase === 'game-over' || state.phase === 'victory') {
    return state;
  }

  if (state.activeCombat.phase !== 'roll-mana') {
    return addLog(state, 'La mana ne peut etre lancee qu au debut de la phase joueuse.');
  }

  if (state.mana !== null) {
    return addLog(state, 'Mana deja lancee pour ce round. Une relance demandera une action speciale.');
  }

  const mana = rollDie();
  let nextState: GameState = { ...state, mana, manaJustRolled: true, activeCombat: { ...state.activeCombat, phase: 'player' } };

  if (state.activeCombat.round === 1) {
    const hasteEnemies = state.activeCombat.enemies.filter((e) => e.enemyHealth > 0 && hasTrait(e.enemyId, 'hâte', e.suppressedTraits));
    if (hasteEnemies.length > 0) {
      const hateDamage = hasteEnemies.reduce((sum, e) => sum + e.resolvedAttack, 0);
      return addLog(
        { ...nextState, pendingHasteAttack: hateDamage, activeCombat: { ...state.activeCombat, phase: 'haste' as const } },
        `Hâte ! ${hasteEnemies.length} ennemi(s) attaque(nt) pour ${hateDamage} dégâts immédiats. Vous pouvez réduire votre mana pour bloquer.`
      );
    }
  }

  return addLog(nextState, `Mana disponible pour ce round : ${mana}. Phase joueuse.`);
}

export function resolveHasteAttack(state: GameState, manaSpent: number): GameState {
  if (!state.activeCombat || state.activeCombat.phase !== 'haste' || state.pendingHasteAttack === null) return state;

  const maxSpend = Math.min(manaSpent, state.mana ?? 0, state.pendingHasteAttack);
  const actualSpent = Math.max(0, maxSpend);
  const damage = Math.max(0, state.pendingHasteAttack - actualSpent);
  const newMana = (state.mana ?? 0) - actualSpent;

  const { health, healthLimit } = applyDamageToHealth(state.health, state.healthLimit, damage);
  let nextState: GameState = addLog(
    {
      ...state,
      mana: newMana,
      health,
      healthLimit,
      pendingHasteAttack: null,
      activeCombat: { ...state.activeCombat, phase: 'player', hasteAttackedRound1: true }
    },
    `Hâte résolu : ${damage} dégât(s) subis${actualSpent > 0 ? ` (${actualSpent} mana dépensés)` : ''}. Phase joueuse.`
  );

  if (health <= 0) {
    nextState = addLog({ ...nextState, health: 0, phase: 'game-over' }, 'Défaite. La partie est terminée.');
  }
  return nextState;
}

export function playActionCard(state: GameState, cardId: string, targetInstanceId: string | null): GameState {
  if (!state.activeCombat) {
    return addLog(state, 'Aucun combat actif.');
  }

  if (state.combatFeedback) {
    return state;
  }

  if (state.activeCombat.phase !== 'player') {
    return addLog(state, 'Les cartes ne peuvent etre jouees que pendant la phase joueuse.');
  }

  if (state.pendingEnemyReroll || state.pendingKeywordCancel || state.pendingRemoveFromCombat) {
    return addLog(state, 'Resolvez d abord l effet en attente avant de jouer une autre carte.');
  }

  const card = getAction(cardId);
  const handIndex = state.hand.indexOf(cardId);
  if (!card || handIndex === -1) {
    return state;
  }

  const face = getActiveCardFace(card, state.flippedCards);
  const mana = state.mana ?? 0;
  if (face.manaCost === null) {
    return addLog(state, 'Mana non renseignee pour cette carte.');
  }

  if (mana < face.manaCost) {
    return addLog(state, 'Mana insuffisante pour jouer cette carte.');
  }

  const needsTarget = faceNeedsTarget(face);
  const target = targetInstanceId ? state.activeCombat.enemies.find((enemy) => enemy.instanceId === targetInstanceId) : undefined;

  if (needsTarget) {
    if (!target) {
      return addLog(state, 'Cible invalide pour cette carte.');
    }
    if (!isValidCombatTarget(state.activeCombat, targetInstanceId!)) {
      return addLog(state, "Cet ennemi est Caché et ne peut pas être ciblé tant que d'autres ennemis sont présents.");
    }
  }

  let nextState: GameState = {
    ...state,
    mana: mana - face.manaCost,
    manaJustRolled: false,
    hand: state.hand.filter((_, index) => index !== handIndex),
    discard: [...state.discard, cardId],
    banishableCardId: cardId
  };

  nextState = applyActionEffects(nextState, face, target?.instanceId ?? null);

  return nextState.activeCombat || nextState.combatFeedback ? nextState : continuePendingResolution(nextState);
}

export function endPlayerPhase(state: GameState): GameState {
  if (!state.activeCombat) {
    return state;
  }

  if (state.combatFeedback) {
    return state;
  }

  if (state.activeCombat.phase !== 'player') {
    return addLog(state, 'La phase joueuse ne peut etre terminee qu apres le lancer de mana.');
  }

  if (state.pendingEnemyReroll || state.pendingKeywordCancel || state.pendingRemoveFromCombat) {
    return addLog(state, 'Resolvez d abord l effet en attente avant de terminer la phase.');
  }

  return addLog(
    { ...state, banishableCardId: null, activeCombat: { ...state.activeCombat, phase: 'enemy' } },
    'Phase joueuse terminee. Resous maintenant l attaque ennemie.'
  );
}

export function endCombatRound(state: GameState): GameState {
  if (!state.activeCombat) {
    return state;
  }

  if (state.combatFeedback) {
    return state;
  }

  if (state.activeCombat.phase !== 'enemy') {
    return addLog(state, 'Termine d abord la phase joueuse avant de resoudre l attaque ennemie.');
  }

  const isHasteRound1 = state.activeCombat.round === 1 && Boolean(state.activeCombat.hasteAttackedRound1);
  const noDefense = state.activeCombat.defense === 0;

  const incomingDamage = state.activeCombat.enemies.reduce((total, combatEnemy) => {
    if (combatEnemy.enemyHealth <= 0) return total;
    if (isHasteRound1 && hasTrait(combatEnemy.enemyId, 'hâte', combatEnemy.suppressedTraits)) return total;
    const atk = combatEnemy.resolvedAttack;
    return total + (noDefense && hasTrait(combatEnemy.enemyId, 'rage', combatEnemy.suppressedTraits) ? atk * 2 : atk);
  }, 0);

  const blocked = state.activeCombat.defense;
  const net = Math.max(0, incomingDamage - blocked);
  const { health, healthLimit } = applyDamageToHealth(state.health, state.healthLimit, net);
  const playerFeedback = { incomingDamage, blocked, net };

  let rageNote = '';
  if (noDefense && state.activeCombat.enemies.some((e) => e.enemyHealth > 0 && hasTrait(e.enemyId, 'rage', e.suppressedTraits))) {
    rageNote = ' (Rage : attaque doublée)';
  }

  let nextState = addLog(
    { ...state, health, healthLimit, mana: null, banishableCardId: null, playerFeedback, activeCombat: { ...state.activeCombat, round: state.activeCombat.round + 1, defense: 0, phase: 'roll-mana' } },
    `Les ennemis attaquent : ${incomingDamage} degats${rageNote}, ${blocked} defense, -${net} PV. Round ${state.activeCombat.round + 1}.`
  );

  if (health <= 0) {
    nextState = addLog({ ...nextState, health: 0, phase: 'game-over' }, 'Defaite. La partie est terminee.');
  }

  if (net > 0 && nextState.phase !== 'game-over') {
    const fbEnemies = state.activeCombat.enemies.filter(
      (e) => e.enemyHealth > 0 && hasTrait(e.enemyId, 'force brutale', e.suppressedTraits)
    );
    for (const _ of fbEnemies) {
      if (nextState.hand.length > 0) {
        const idx = Math.floor(Math.random() * nextState.hand.length);
        const discardedId = nextState.hand[idx];
        nextState = addLog(
          { ...nextState, hand: nextState.hand.filter((_, i) => i !== idx), discard: [...nextState.discard, discardedId] },
          'Force Brutale : une carte aleatoire de ta main est defaussee.'
        );
      }
    }
  }

  return nextState;
}

export function clearPlayerFeedback(state: GameState): GameState {
  return { ...state, playerFeedback: null };
}

export function usePotion(state: GameState): GameState {
  if (state.potions <= 0 || state.phase === 'game-over' || state.phase === 'victory') {
    return state;
  }

  return addLog(
    {
      ...state,
      manaJustRolled: false,
      potions: state.potions - 1,
      health: recoverHealth(state.health, state.healthLimit, 4)
    },
    'Potion utilisee : +4 PV.'
  );
}

function applyActionEffects(state: GameState, face: CardFaceData, targetInstanceId: string | null): GameState {
  let nextState = addLog(state, 'Carte jouee.');
  const damageHits: number[] = [];

  for (const effect of face.effects) {
    if (effect.kind === 'damage') {
      damageHits.push(effect.value);
    } else if (effect.kind === 'damage-top-deck') {
      const topCardId = nextState.deck[0];
      const topCard = topCardId ? getAction(topCardId) : null;
      const topFace = topCard ? getActiveCardFace(topCard, nextState.flippedCards) : null;
      const dmg = topFace?.manaCost ?? 0;
      nextState = addLog(nextState, `${dmg} degats (cout mana de la prochaine carte).`);
      damageHits.push(dmg);
    } else if (effect.kind === 'self-damage') {
      const { health, healthLimit } = applyDamageToHealth(nextState.health, nextState.healthLimit, effect.value);
      nextState = addLog({ ...nextState, health, healthLimit }, `${effect.value} degat subi.`);
      if (health <= 0) {
        nextState = addLog({ ...nextState, phase: 'game-over' }, 'Defaite. La partie est terminee.');
      }
    } else if (effect.kind === 'defense' && nextState.activeCombat) {
      nextState = addLog(
        { ...nextState, activeCombat: { ...nextState.activeCombat, defense: nextState.activeCombat.defense + effect.value } },
        `+${effect.value} defense pour ce round.`
      );
    } else if (effect.kind === 'heal') {
      const before = nextState.health;
      const health = recoverHealth(before, nextState.healthLimit, effect.value);
      nextState = addLog({ ...nextState, health }, `Soin : +${health - before} PV.`);
    } else if (effect.kind === 'draw') {
      nextState = drawActionCards(nextState, effect.value, 'Carte');
    } else if (effect.kind === 'mana') {
      const mana = (nextState.mana ?? 0) + effect.value;
      nextState = addLog({ ...nextState, mana }, `+${effect.value} mana.`);
    } else if (effect.kind === 'reroll-mana') {
      const mana = rollDie();
      nextState = addLog({ ...nextState, mana }, `Nouveau lancer de mana → ${mana}.`);
    } else if (effect.kind === 'discard-random') {
      if (nextState.hand.length > 0) {
        const randomIndex = Math.floor(Math.random() * nextState.hand.length);
        const discardedCardId = nextState.hand[randomIndex];
        nextState = addLog(
          { ...nextState, hand: nextState.hand.filter((_, i) => i !== randomIndex), discard: [...nextState.discard, discardedCardId] },
          'Carte defaussee au hasard.'
        );
      }
    } else if (effect.kind === 'reroll-enemy-die') {
      nextState = addLog(
        { ...nextState, pendingEnemyReroll: { remainingRerolls: effect.maxRerolls } },
        `Choisissez un de ennemi a relancer (${effect.maxRerolls} relance(s)).`
      );
    } else if (effect.kind === 'cancel-enemy-keyword') {
      nextState = addLog(
        { ...nextState, pendingKeywordCancel: true },
        "Choisissez un ennemi dont annuler le mot-cle."
      );
    } else if (effect.kind === 'remove-from-combat') {
      nextState = addLog(
        { ...nextState, pendingRemoveFromCombat: true },
        "Choisissez un ennemi (avec mot-cle) a retirer du combat."
      );
    }
  }

  if (damageHits.length > 0) {
    const [firstHit, ...remainingHits] = damageHits;
    if (remainingHits.length > 0 && nextState.activeCombat) {
      nextState = { ...nextState, activeCombat: { ...nextState.activeCombat, pendingHits: remainingHits } };
    }
    if (firstHit > 0) {
      nextState = applyActionDamage(nextState, firstHit, targetInstanceId ?? '');
    }
  }

  return nextState;
}

export function applyNextPendingHit(state: GameState, targetInstanceId: string): GameState {
  if (!state.activeCombat || state.activeCombat.pendingHits.length === 0 || state.combatFeedback) {
    return state;
  }

  const [nextHit, ...remainingHits] = state.activeCombat.pendingHits;
  const nextState = { ...state, activeCombat: { ...state.activeCombat, pendingHits: remainingHits } };
  return applyActionDamage(nextState, nextHit, targetInstanceId);
}

function applyActionDamage(state: GameState, damage: number, targetInstanceId: string): GameState {
  if (!state.activeCombat || state.combatFeedback || damage <= 0) {
    return state;
  }

  const target = state.activeCombat.enemies.find((enemy) => enemy.instanceId === targetInstanceId);
  if (!target) {
    return addLog(state, 'Cible invalide pour ces degats.');
  }

  const enemyHealth = Math.max(0, target.enemyHealth - damage);
  const willBeDefeated = enemyHealth <= 0;
  const hasCoriace = hasTrait(target.enemyId, 'coriace', target.suppressedTraits);

  if (willBeDefeated && hasCoriace && !target.coriaceRevived) {
    const revivedAttack = target.resolvedAttack + 1;
    // Phase 1 : montrer la défaite (PV à 0), la résurrection est appliquée après l'animation
    const defeatedEnemies = state.activeCombat.enemies.map((e) =>
      e.instanceId === target.instanceId ? { ...e, enemyHealth: 0 } : e
    );
    return addLog(
      {
        ...state,
        activeCombat: { ...state.activeCombat, enemies: defeatedEnemies },
        combatFeedback: { targetInstanceId, damage, defeated: true, xpGained: 0, combatEnded: false, coriaceReviving: true, coriaceRevivedAttack: revivedAttack }
      },
      `${damage} dégâts infligés. Coriace ! L'ennemi revient avec 1 PV et ${revivedAttack} en attaque.`
    );
  }

  const combatEnemies = state.activeCombat.enemies
    .map((enemy) => enemy.instanceId === target.instanceId ? { ...enemy, enemyHealth } : enemy);
  const defeated = willBeDefeated;
  const remainingEnemyCount = combatEnemies.filter((enemy) => enemy.enemyHealth > 0).length;
  const enemy = getEnemy(target.enemyId);
  const xp = defeated ? getEnemyXpForRound(enemy, state.activeCombat.round) : 0;
  let nextState = addLog(
    {
      ...state,
      xp: state.xp + xp,
      activeCombat: { ...state.activeCombat, enemies: combatEnemies },
      combatFeedback: {
        targetInstanceId,
        damage,
        defeated,
        xpGained: xp,
        combatEnded: defeated && remainingEnemyCount === 0
      }
    },
    `${damage} degats infliges a un ennemi.`
  );

  if (defeated) {
    nextState = addLog(nextState, `Ennemi vaincu au round ${state.activeCombat.round}. +${xp} XP.`);
    if (remainingEnemyCount === 0) {
      nextState = addLog(nextState, 'Plus aucun ennemi en jeu : le combat est termine.');
    }
  }

  return nextState;
}

export function resolveEnemyDieReroll(state: GameState, instanceId: string, dieType: 'attack' | 'health'): GameState {
  if (!state.activeCombat || !state.pendingEnemyReroll) return state;

  const enemy = state.activeCombat.enemies.find((e) => e.instanceId === instanceId);
  if (!enemy) return addLog(state, 'Ennemi introuvable.');

  if (dieType === 'attack' && !enemy.attackWasRolled) {
    return addLog(state, 'Cet ennemi n a pas de de Attaque a relancer.');
  }
  if (dieType === 'health' && !enemy.healthWasRolled) {
    return addLog(state, 'Cet ennemi n a pas de de Resistance a relancer.');
  }

  const newValue = rollDie();
  const updatedEnemies = state.activeCombat.enemies.map((e) => {
    if (e.instanceId !== instanceId) return e;
    return dieType === 'attack' ? { ...e, resolvedAttack: newValue } : { ...e, enemyHealth: newValue };
  });

  const { remainingRerolls } = state.pendingEnemyReroll;
  const nextReroll = remainingRerolls - 1 > 0 ? { remainingRerolls: remainingRerolls - 1 } : null;

  return addLog(
    { ...state, activeCombat: { ...state.activeCombat, enemies: updatedEnemies }, pendingEnemyReroll: nextReroll },
    `De ${dieType === 'attack' ? 'Attaque' : 'Resistance'} relance : ${newValue}.${nextReroll ? ` ${nextReroll.remainingRerolls} relance(s) restante(s).` : ''}`
  );
}

export function resolveKeywordCancel(state: GameState, instanceId: string, trait: string): GameState {
  if (!state.activeCombat || !state.pendingKeywordCancel) return state;

  const enemy = state.activeCombat.enemies.find((e) => e.instanceId === instanceId);
  if (!enemy) return addLog(state, 'Ennemi introuvable.');

  const updatedEnemies = state.activeCombat.enemies.map((e) =>
    e.instanceId === instanceId
      ? { ...e, suppressedTraits: [...(e.suppressedTraits ?? []), trait] }
      : e
  );

  return addLog(
    { ...state, activeCombat: { ...state.activeCombat, enemies: updatedEnemies }, pendingKeywordCancel: false },
    `Mot-cle "${trait}" annule pour cet ennemi.`
  );
}

export function resolveRemoveFromCombat(state: GameState, instanceId: string): GameState {
  if (!state.activeCombat || !state.pendingRemoveFromCombat) return state;

  const updatedEnemies = state.activeCombat.enemies.filter((e) => e.instanceId !== instanceId);
  const remainingCount = updatedEnemies.filter((e) => e.enemyHealth > 0).length;

  let nextState: GameState = addLog(
    { ...state, activeCombat: { ...state.activeCombat, enemies: updatedEnemies }, pendingRemoveFromCombat: false },
    'Ennemi retire du combat (sans XP).'
  );

  if (remainingCount === 0) {
    nextState = continuePendingResolution({
      ...nextState,
      activeCombat: null,
      combatFeedback: null,
      mana: null,
      banishableCardId: null
    });
  }

  return nextState;
}

function getEnemyXpForRound(enemy: EnemyCard | undefined, round: number): number {
  if (!enemy) {
    return 0;
  }

  const xpByRound = enemy.xpByRound ?? getFallbackXpByRound(enemy.xpReward ?? 0);
  return xpByRound[round - 1] ?? 0;
}

function getFallbackXpByRound(firstRoundXp: number): number[] {
  return [firstRoundXp, Math.max(0, firstRoundXp - 1), Math.max(0, firstRoundXp - 2), Math.max(0, firstRoundXp - 3)];
}
