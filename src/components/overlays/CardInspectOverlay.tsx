import { useEffect, useRef } from 'react';
import { resolveCardForDisplay } from '../../game/data-access';
import type { ActionCard } from '../../game/types';
import { formatValue, getEffectDisplays } from '../../ui/formatters';

const UPGRADE_XP_COST = 1;

export function CardInspectOverlay({ card, flippedCards, xp, canUpgrade, onUpgrade, onClose, onPlay, playDisabledReason, onDiscardForMana, discardDisabled }: {
  card: ActionCard | null;
  flippedCards: string[];
  xp?: number;
  canUpgrade?: boolean;
  onUpgrade?: (cardId: string) => void;
  onClose: () => void;
  onPlay?: () => void;
  playDisabledReason?: string | null;
  onDiscardForMana?: () => void;
  discardDisabled?: boolean;
}) {
  const justOpenedRef = useRef(false);
  useEffect(() => {
    if (!card) return;
    justOpenedRef.current = true;
    const t = window.setTimeout(() => { justOpenedRef.current = false; }, 350);
    return () => window.clearTimeout(t);
  }, [card]);

  if (!card) return null;
  const resolved = resolveCardForDisplay(card, flippedCards);
  const isFlipped = !!card.level2 && flippedCards.includes(card.id);
  const upgradeCost = UPGRADE_XP_COST;
  const upgradeAvailable = canUpgrade && !!card.level2 && !isFlipped && (xp ?? 0) >= upgradeCost;

  return (
    <div aria-label="Inspecter la carte" aria-modal="true" className="card-inspect-overlay" onClick={() => { if (!justOpenedRef.current) onClose(); }} role="dialog">
      <div className="card-inspect-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`card-inspect-tile ${card.kind}`}>
          <div className="card-inspect-header">
            <span className="mana-chip">{formatValue(resolved.manaCost)}</span>
            <span className="card-inspect-kind">
              {card.kind === 'advanced-action' ? 'Action avancée' : 'Action'}
            </span>
          </div>
          {isFlipped && <span className="card-level-badge">Niv. 2</span>}
          <p className="card-inspect-text">{resolved.text}</p>
          {resolved.traits && resolved.traits.length > 0 && (
            <p className="card-inspect-traits">{resolved.traits.join(' · ')}</p>
          )}
          <div className="effect-row card-inspect-effects">
            {getEffectDisplays(resolved).map(({ label, kind }, i) => (
              <span className={`effect-badge effect-${kind}`} key={i}>{label}</span>
            ))}
          </div>
          {card.notes && <p className="card-inspect-notes muted">{card.notes}</p>}
        </div>
        <div className="card-inspect-actions">
          {upgradeAvailable && onUpgrade && (
            <button
              className="primary-button"
              onClick={() => { onUpgrade(card.id); onClose(); }}
              type="button"
            >
              Améliorer — {upgradeCost} XP
            </button>
          )}
          {!isFlipped && card.level2 && !upgradeAvailable && (
            <p className="card-inspect-upgrade-hint muted">
              {isFlipped ? 'Déjà au niveau 2.' : `Amélioration : ${upgradeCost} XP (carte en main)`}
            </p>
          )}
          {onDiscardForMana && (
            <button
              className="secondary-button"
              disabled={discardDisabled}
              onClick={() => { onDiscardForMana(); onClose(); }}
              type="button"
            >
              Défausser +1◆
            </button>
          )}
          {onPlay && (
            <button
              className="primary-button"
              disabled={!!playDisabledReason}
              onClick={() => { onPlay(); onClose(); }}
              title={playDisabledReason ?? undefined}
              type="button"
            >
              Jouer
            </button>
          )}
          <button className="secondary-button card-inspect-close" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
