import type { ActionCard, ActionEffect, BossCard, CombatPhase, EnemyCard } from '../game/types';

export type CardSummary = ActionCard | BossCard | EnemyCard;

export function formatValue(value: number | string | null) {
  return value ?? '?';
}

function effectToSentence(effect: ActionEffect, topDeckManaCost?: number): string {
  switch (effect.kind) {
    case 'damage':
      return `Infligez ${effect.value} dégât${effect.value > 1 ? 's' : ''}.`;
    case 'damage-top-deck': {
      if (topDeckManaCost !== undefined) {
        const total = topDeckManaCost + (effect.bonus ?? 0);
        return effect.bonus
          ? `Infligez ${total} dégâts (${topDeckManaCost}+${effect.bonus}, coût Mana du dessus du deck).`
          : `Infligez ${total} dégâts (coût Mana du dessus du deck).`;
      }
      return effect.bonus
        ? `Infligez X+${effect.bonus} dégâts (X = coût Mana du dessus du deck Action).`
        : `Infligez X dégâts (X = coût Mana du dessus du deck Action).`;
    }
    case 'defense':
      return `Gagnez ${effect.value} Défense${effect.value > 1 ? 's' : ''}.`;
    case 'heal':
      return `Récupérez ${effect.value} PV.`;
    case 'draw':
      return `Piochez ${effect.value} carte${effect.value > 1 ? 's' : ''}.`;
    case 'mana':
      return `Gagnez ${effect.value} Mana.`;
    case 'reroll-mana':
      return effect.bonus
        ? `Relancez le dé de Mana (+${effect.bonus} au résultat, max 6). Condition : début du round.`
        : `Relancez le dé de Mana. Condition : début du round.`;
    case 'self-damage':
      return `Subissez ${effect.value} dégât${effect.value > 1 ? 's' : ''}.`;
    case 'discard-random':
      return `Défaussez une carte au hasard de votre main.`;
    case 'reroll-enemy-die':
      return effect.maxRerolls === 1
        ? `Relancez 1 fois un dé Résistance ou Attaque d'un ennemi.`
        : `Relancez jusqu'à ${effect.maxRerolls} fois un dé Résistance ou Attaque d'un ennemi.`;
    case 'cancel-enemy-keyword':
      return `Annulez un mot-clé d'un ennemi en jeu.`;
    case 'remove-from-combat':
      return `Retirez du combat un ennemi (avec mot-clé) et défaussez-le.`;
    case 'self-damage-x':
      return `Choisissez X (0–${effect.max}). Subissez X dégâts. Infligez X dégâts. Piochez 1 carte.`;
  }
}

export function deriveFaceLines(effects: ActionEffect[], requiresLocations?: boolean, topDeckManaCost?: number): string[] {
  const lines: string[] = [];
  if (requiresLocations) lines.push('Changez de lieu. Condition : début du combat.');
  for (const effect of effects) lines.push(effectToSentence(effect, topDeckManaCost));
  return lines;
}

export function deriveFaceCompact(effects: ActionEffect[], requiresLocations?: boolean): string {
  return deriveFaceLines(effects, requiresLocations).join(' ');
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
    if (effect.kind === 'reroll-enemy-die') return `relance dé ennemi (max ${effect.maxRerolls})`;
    if (effect.kind === 'cancel-enemy-keyword') return 'annule mot-clé ennemi';
    if (effect.kind === 'remove-from-combat') return 'retire du combat';
    return `+${effect.value} mana`;
  }).join(', ');
}

export function formatActionEffectIcons(card: ActionCard) {
  return card.effects.map((effect) => effectLabel(effect)).join(' ');
}

export function getEffectDisplays(card: { effects: ActionEffect[] }, topDeckManaCost?: number): { label: string; kind: string }[] {
  return card.effects.map((effect) => ({ label: effectLabel(effect, topDeckManaCost), kind: effect.kind }));
}

function effectLabel(effect: ActionEffect, topDeckManaCost?: number): string {
  if (effect.kind === 'damage') return `⚔ ${effect.value}`;
  if (effect.kind === 'damage-top-deck') {
    const x = topDeckManaCost ?? null;
    if (x !== null) return effect.bonus ? `⚔ ${x + effect.bonus}` : `⚔ ${x}`;
    return effect.bonus ? `⚔ ?+${effect.bonus}` : '⚔ ?';
  }
  if (effect.kind === 'defense') return `🛡 ${effect.value}`;
  if (effect.kind === 'heal') return `♥ ${effect.value}`;
  if (effect.kind === 'draw') return `↑ ${effect.value}`;
  if (effect.kind === 'reroll-mana') return effect.bonus ? `↺ ◆+${effect.bonus}` : '↺ ◆';
  if (effect.kind === 'self-damage') return `-♥ ${effect.value}`;
  if (effect.kind === 'discard-random') return '↓ ?';
  if (effect.kind === 'self-damage-x') return `⇄ X`;
  if (effect.kind === 'reroll-enemy-die') return `↺ ennemi`;
  if (effect.kind === 'cancel-enemy-keyword') return `✗ mot-clé`;
  if (effect.kind === 'remove-from-combat') return `⊗ combat`;
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
