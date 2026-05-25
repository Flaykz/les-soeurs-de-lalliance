import { baseBosses, towerDefinitions } from '../data/baseSet';
import { getHealthRecoveryLimit } from '../game/health';
import type { CombatEnemy, GameState, TrapFeedback, TreasureFeedback } from '../game/types';

export const STORAGE_KEY = 'lsa-current-game';

export function getBuyActionDisabledReason(game: GameState): string | null {
  const inCombat = game.activeCombat || game.activeBossCombat;
  if (!inCombat) return null;
  if (game.combatFeedback || game.bossCombatFeedback) return 'Resolution de combat en cours.';
  const phase = game.activeCombat?.phase ?? game.activeBossCombat?.phase;
  if (phase !== 'player') return 'Achat possible pendant la phase joueuse.';
  if (game.mana === null) return 'Lance d’abord le de de mana.';
  if (game.mana < 1) return 'Mana insuffisante.';
  if (game.hand.length >= 5) return 'Main pleine.';
  if (game.deck.length === 0 && game.discard.length > 0) return 'Deck action en cours de remelange.';
  if (game.deck.length === 0 && game.discard.length === 0) return 'Deck action et defausse vides.';
  return null;
}

export function getDiscardForManaDisabledReason(game: GameState, handIndex: number): string | null {
  if (!game.activeCombat) return 'Aucun combat actif.';
  if (game.combatFeedback) return 'resolution de combat en cours.';
  if (game.activeCombat.phase !== 'player') return 'possible pendant la phase joueuse.';
  if (game.mana === null) return 'lance d’abord le de de mana.';
  if (game.mana >= 6) return 'mana deja au maximum 6.';
  if (!game.hand[handIndex]) return 'aucune carte selectionnee.';
  return null;
}

export function loadSavedGame(): GameState | null {
  const rawGame = localStorage.getItem(STORAGE_KEY);
  if (!rawGame) return null;

  try {
    const parsedGame = JSON.parse(rawGame) as GameState;
    if (
      typeof parsedGame.position !== 'string'
      || !('selectedMovement' in parsedGame)
      || !('pendingMovementPaths' in parsedGame)
      || !('selectedMovementPathIndex' in parsedGame)
      || !('pendingCombatGroups' in parsedGame)
      || !('pendingTreasures' in parsedGame)
      || !('pendingBossCellId' in parsedGame)
      || !Array.isArray(parsedGame.towerIds)
      || typeof parsedGame.currentTowerIndex !== 'number'
      || typeof parsedGame.towerSequenceCount !== 'number'
      || !Array.isArray(parsedGame.advancedDecks)
      || parsedGame.advancedDecks.length !== 2
      || (parsedGame.activeCombat !== null && typeof parsedGame.activeCombat.round !== 'number')
      || (parsedGame.activeCombat !== null && typeof parsedGame.activeCombat.defense !== 'number')
      || (parsedGame.activeCombat !== null && !['roll-mana', 'player', 'enemy', 'haste'].includes(parsedGame.activeCombat.phase))
      || !baseBosses.some((boss) => boss.id === parsedGame.bossId)
      || !towerDefinitions.some((tower) => tower.id === parsedGame.towerId)
      || !parsedGame.towerIds.every((towerId) => towerDefinitions.some((tower) => tower.id === towerId))
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      ...parsedGame,
      healthLimit: parsedGame.healthLimit ?? getHealthRecoveryLimit(parsedGame.health),
      pendingTraps: Array.isArray(parsedGame.pendingTraps) ? parsedGame.pendingTraps : [],
      pendingCellRoll: parsedGame.pendingCellRoll ?? null,
      pendingTrapLevelDiscard: parsedGame.pendingTrapLevelDiscard ?? null,
      pendingTreasureChoice: parsedGame.pendingTreasureChoice ? {
        ...parsedGame.pendingTreasureChoice,
        remaining: parsedGame.pendingTreasureChoice.remaining ?? 1
      } : null,
      combatFeedback: parsedGame.combatFeedback ?? null,
      playerFeedback: parsedGame.playerFeedback ?? null,
      trapFeedback: null,
      treasureFeedback: null,
      banishableCardId: parsedGame.banishableCardId ?? null,
      pendingHasteAttack: parsedGame.pendingHasteAttack ?? null,
      activeCombat: parsedGame.activeCombat ? {
        ...parsedGame.activeCombat,
        pendingHits: Array.isArray(parsedGame.activeCombat.pendingHits) ? parsedGame.activeCombat.pendingHits : [],
        enemies: (parsedGame.activeCombat.enemies as unknown as Array<Partial<CombatEnemy>>).map((e) => ({
          instanceId: String(e.instanceId ?? ''),
          enemyId: String(e.enemyId ?? ''),
          enemyHealth: Number(e.enemyHealth ?? 0),
          resolvedAttack: Number(e.resolvedAttack ?? 0),
          coriaceRevived: e.coriaceRevived
        } satisfies CombatEnemy))
      } : null
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function describeTreasureConsequence(fb: TreasureFeedback): string {
  switch (fb.consequence) {
    case 'card-from-deck': return fb.cardsRecovered && fb.cardsRecovered > 1 ? `${fb.cardsRecovered} cartes récupérées du deck !` : 'Carte récupérée du deck !';
    case 'card-from-discard': return fb.cardsRecovered && fb.cardsRecovered > 1 ? `${fb.cardsRecovered} cartes récupérées de la défausse !` : 'Carte récupérée de la défausse !';
    case 'xp': return `+${fb.xpGained ?? 1} XP !`;
    case 'potion': return `+${fb.potionsGained ?? 1} Potion${(fb.potionsGained ?? 1) > 1 ? 's' : ''} !`;
    case 'no-effect': return 'Aucune carte disponible.';
  }
}

export function describeTrapConsequenceTitle(fb: TrapFeedback): string {
  if (fb.consequence === 'level-trap') return `Piège niveau ${fb.trapLevel}`;
  return 'Résultat du piège';
}

export function describeTrapConsequence(fb: TrapFeedback): string {
  switch (fb.consequence) {
    case 'level-trap': {
      if (fb.damage === 0) return 'Protection réussie — aucun dégât !';
      const bonus = fb.manaBonus ?? 0;
      if (bonus > 0) return `${fb.trapLevel} − (${fb.defenseRoll} + ${bonus}) = ${fb.damage} dégât${fb.damage > 1 ? 's' : ''} !`;
      return `${fb.trapLevel} − ${fb.defenseRoll} = ${fb.damage} dégât${fb.damage > 1 ? 's' : ''} !`;
    }
    case 'direct-damage': return `${fb.damage} dégât${fb.damage > 1 ? 's' : ''} !`;
    case 'discard-hand': return 'Une carte de main défaussée.';
    case 'discard-deck': return `${fb.cardsDiscarded ?? 5} carte(s) du deck défaussée(s).`;
    case 'discard-hand-advanced': return `${fb.cardsDiscarded ?? 0} carte(s) action avancée(s) défaussée(s).`;
    case 'discard-hand-all': return `Toute la main défaussée (${fb.cardsDiscarded ?? 0} carte(s)).`;
    case 'no-effect': return 'Aucun effet.';
  }
}
