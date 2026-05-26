import type { CombatFeedback, EnemyCard } from '../game/types';
import { formatValue, getEnemyXpByRound } from '../ui/formatters';

interface EnemyCardDisplayProps {
  card: EnemyCard | undefined;
  instanceId?: string;
  currentHealth?: number;
  resolvedAttack?: number;
  isSelected?: boolean;
  isInteractive?: boolean;
  isUntargetable?: boolean;
  feedback?: CombatFeedback | null;
  combatRound?: number;
  disabled?: boolean;
  onSelect?: () => void;
}

export function EnemyCardDisplay({
  card,
  instanceId,
  currentHealth,
  resolvedAttack,
  isSelected = false,
  isInteractive = false,
  isUntargetable = false,
  feedback = null,
  combatRound = 0,
  disabled = false,
  onSelect,
}: EnemyCardDisplayProps) {
  const displayHealth = currentHealth ?? card?.health ?? null;
  const allRounds = getEnemyXpByRound(card);
  const lastNonZero = allRounds.reduceRight((found, xp, i) => found === -1 && xp > 0 ? i : found, -1);
  const firstZeroIdx = lastNonZero + 1;
  const hasZeroEntry = firstZeroIdx < allRounds.length;
  const displayCount = hasZeroEntry ? firstZeroIdx + 1 : (lastNonZero >= 0 ? lastNonZero + 1 : 1);
  const xpByRound = allRounds.slice(0, displayCount);

  const traits = (card?.traits ?? []).filter(t => !isUntargetable || t.toLowerCase() !== 'caché');

  const classNames = [
    'enemy-target-card',
    isSelected ? 'selected' : '',
    feedback && !feedback.coriaceReviving && !feedback.coriaceJustRevived ? 'hit' : '',
    feedback?.defeated && !feedback.coriaceReviving ? 'defeated' : '',
    feedback?.coriaceReviving ? 'coriace-reviving' : '',
    feedback?.coriaceJustRevived ? 'coriace-just-revived' : '',
    isUntargetable ? 'untargetable' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {feedback && !feedback.coriaceReviving && !feedback.coriaceJustRevived && feedback.damage > 0 && (
        <span className="damage-float">-{feedback.damage} PV</span>
      )}
      {feedback?.coriaceReviving && <span className="coriace-banner">Coriace !</span>}
      {feedback?.coriaceJustRevived && <span className="coriace-revive-banner">Résiste !</span>}
      {feedback?.coriaceJustRevived && <span className="attack-bump-float">+1 ⚔</span>}
      {feedback?.defeated && !feedback.coriaceReviving && <span className="defeat-banner">Vaincu</span>}
      {feedback?.defeated && !feedback.coriaceReviving && feedback.xpGained > 0 && <span className="xp-float">+{feedback.xpGained} XP</span>}

      <div className="enemy-card-stats-row">
        <span className="enemy-stat-bubble hp-bubble" aria-label={`${displayHealth} PV`}>
          <span className="bubble-value">{formatValue(displayHealth)}</span>
          <span className="bubble-label">♥ PV</span>
        </span>
        <span className="enemy-stat-bubble attack-bubble" aria-label={`Attaque ${resolvedAttack !== undefined && card?.attack === '?' ? resolvedAttack : formatValue(card?.attack ?? null)}`}>
          <span className="bubble-value">{resolvedAttack !== undefined && card?.attack === '?' ? resolvedAttack : formatValue(card?.attack ?? null)}</span>
          <span className="bubble-label">⚔ ATT</span>
        </span>
      </div>

      <div className="enemy-card-art" aria-hidden="true">
        ☠
        {isUntargetable && <span className="enemy-hidden-overlay">Caché</span>}
      </div>

      <div className="enemy-xp-track" aria-label="Gains XP par round">
        {xpByRound.map((xp, i) => {
          const isZeroEntry = hasZeroEntry && i === firstZeroIdx;
          return (
            <div className={`enemy-xp-col${combatRound > 0 && i + 1 === combatRound ? ' active' : ''}`} key={i}>
              <span className="xp-round-label">R{i + 1}{isZeroEntry ? '+' : ''}</span>
              <span className="xp-round-value">{xp}</span>
            </div>
          );
        })}
      </div>
      {traits.length > 0 && (
        <div className="enemy-traits">
          {traits.map((trait) => (
            <span className="enemy-trait-badge" key={trait}>{trait}</span>
          ))}
        </div>
      )}
    </>
  );

  const dataAttrs = {
    'data-enemy-card': '',
    ...(instanceId ? { 'data-enemy-id': instanceId } : {}),
    ...(feedback?.defeated ? { 'data-defeated': '' } : {}),
  };

  if (isInteractive) {
    return (
      <button
        aria-label={card?.id ?? 'Ennemi'}
        className={classNames}
        disabled={disabled || isUntargetable}
        onClick={onSelect}
        type="button"
        {...dataAttrs}
      >
        {content}
      </button>
    );
  }

  return (
    <article aria-label={card?.id ?? 'Ennemi'} className={classNames} {...dataAttrs}>
      {content}
    </article>
  );
}
