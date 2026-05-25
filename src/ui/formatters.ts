import type { ActionCard, ActionEffect, BossCard, CombatPhase, EnemyCard } from '../game/types';

export type CardSummary = ActionCard | BossCard | EnemyCard;

export function formatValue(value: number | string | null) {
  return value ?? '?';
}

export function formatActionEffects(card: ActionCard) {
  return card.effects.map((effect) => {
    if (effect.kind === 'damage') return `${effect.value} degats`;
    if (effect.kind === 'damage-top-deck') return effect.bonus ? `degats = cout mana top deck +${effect.bonus}` : 'degats = cout mana top deck';
    if (effect.kind === 'defense') return `+${effect.value} defense`;
    if (effect.kind === 'heal') return `+${effect.value} PV`;
    if (effect.kind === 'draw') return `pioche ${effect.value}`;
    if (effect.kind === 'reroll-mana') return effect.bonus ? `relance mana +${effect.bonus}` : 'relance mana';
    if (effect.kind === 'self-damage') return `-${effect.value} PV (soi)`;
    if (effect.kind === 'discard-random') return 'defausse 1 carte au hasard';
    if (effect.kind === 'self-damage-x') return `subis X / inflige X / pioche 1 (X 0–${effect.max})`;
    return `+${effect.value} mana`;
  }).join(', ');
}

export function formatActionEffectIcons(card: ActionCard) {
  return card.effects.map((effect) => effectLabel(effect)).join(' ');
}

export function getEffectDisplays(card: ActionCard): { label: string; kind: string }[] {
  return card.effects.map((effect) => ({ label: effectLabel(effect), kind: effect.kind }));
}

function effectLabel(effect: ActionEffect): string {
  if (effect.kind === 'damage') return `⚔ ${effect.value}`;
  if (effect.kind === 'damage-top-deck') return effect.bonus ? `⚔ ?+${effect.bonus}` : '⚔ ?';
  if (effect.kind === 'defense') return `🛡 ${effect.value}`;
  if (effect.kind === 'heal') return `♥ ${effect.value}`;
  if (effect.kind === 'draw') return `↑ ${effect.value}`;
  if (effect.kind === 'reroll-mana') return effect.bonus ? `↺ ◆+${effect.bonus}` : '↺ ◆';
  if (effect.kind === 'self-damage') return `-♥ ${effect.value}`;
  if (effect.kind === 'discard-random') return '↓ ?';
  if (effect.kind === 'self-damage-x') return `⇄ X`;
  return `◆ ${effect.value}`;
}

export function formatCombatPhase(phase: CombatPhase) {
  if (phase === 'roll-mana') return 'lancer la mana';
  if (phase === 'player') return 'joueuse';
  return 'ennemie';
}

export function formatEnemyXpTrack(enemy: EnemyCard | undefined) {
  const xpByRound = enemy?.xpByRound ?? getFallbackXpByRound(enemy?.xpReward ?? 0);
  return xpByRound.map((xp, index) => `R${index + 1}:${xp}`).join(' / ');
}

export function getCardMeta(card: CardSummary) {
  if (card.kind === 'action' || card.kind === 'advanced-action') {
    return `${card.kind === 'action' ? 'Action' : 'Action avancee'} | cout ${formatValue(card.manaCost)} | ${formatActionEffects(card)}`;
  }

  if (card.kind === 'boss') {
    return `Boss | attaque ${formatValue(card.attack)} | PV ${card.healthDice.join('/')}`;
  }

  if (card.kind === 'enemy') {
    return `Ennemi | attaque ${formatValue(card.attack)} | PV ${formatValue(card.health)} | XP ${formatValue(card.xpReward)}`;
  }

  return card.kind;
}

function getFallbackXpByRound(firstRoundXp: number): number[] {
  return [firstRoundXp, Math.max(0, firstRoundXp - 1), Math.max(0, firstRoundXp - 2), Math.max(0, firstRoundXp - 3)];
}

export function getEnemyXpByRound(enemy: EnemyCard | undefined): number[] {
  return enemy?.xpByRound ?? getFallbackXpByRound(enemy?.xpReward ?? 0);
}
