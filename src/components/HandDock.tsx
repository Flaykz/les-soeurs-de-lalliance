import { useState } from 'react';
import { getAction, resolveCardForDisplay } from '../game/rules';
import type { ActionCard, GameState } from '../game/types';
import { getDiscardForManaDisabledReason } from '../ui/appHelpers';
import { formatValue } from '../ui/formatters';
import { ActionCardContent } from './CardCatalog';

const FAN_ANGLE = 10;
const PLAY_THRESHOLD = 100;
const VISUAL_DRAG_THRESHOLD = 8;

export function HandDock({ game, onDiscardForMana, onPlayCard, onSelectCard, onInspectCard, selectedEnemyInstanceId, selectedHandIndex }: {
  game: GameState;
  onDiscardForMana: () => void;
  onPlayCard: (cardId: string) => void;
  onSelectCard: (index: number | null) => void;
  onInspectCard: (card: ActionCard) => void;
  selectedEnemyInstanceId: string | null;
  selectedHandIndex: number | null;
}) {
  const [dragState, setDragState] = useState<{ cardId: string; startY: number; currentY: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const selectedCardId = selectedHandIndex === null ? null : game.hand[selectedHandIndex] ?? null;
  const selectedCardRaw = selectedCardId ? getAction(selectedCardId) ?? null : null;
  const selectedCard = selectedCardRaw ? resolveCardForDisplay(selectedCardRaw, game.flippedCards) : null;
  const disabledReason = selectedCard ? getCardDisabledReason(selectedCard, game, selectedEnemyInstanceId) : null;
  const discardDisabled = selectedHandIndex === null ? true : Boolean(getDiscardForManaDisabledReason(game, selectedHandIndex));

  const dragDeltaY = dragState ? Math.max(0, dragState.startY - dragState.currentY) : 0;
  const isDragReady = dragDeltaY >= PLAY_THRESHOLD;

  const n = game.hand.length;
  const mid = (n - 1) / 2;

  function getFanTransform(index: number, isSelected: boolean, isDraggingThis: boolean): string {
    if (isDraggingThis && dragDeltaY > VISUAL_DRAG_THRESHOLD) {
      const baseLift = isSelected ? 50 : 0;
      return `rotate(0deg) translateY(${-(baseLift + Math.min(dragDeltaY - VISUAL_DRAG_THRESHOLD, 220))}px)`;
    }
    const isLifted = isSelected || hoveredIndex === index;
    if (isLifted) return 'rotate(0deg) translateY(-50px)';
    const rot = (index - mid) * FAN_ANGLE;
    return `rotate(${rot}deg)`;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, cardId: string) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({ cardId, startY: e.clientY, currentY: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>, cardId: string) {
    if (!dragState || dragState.cardId !== cardId) return;
    setDragState((prev) => prev ? { ...prev, currentY: e.clientY } : null);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>, cardId: string, index: number) {
    if (!dragState || dragState.cardId !== cardId) {
      setDragState(null);
      return;
    }
    const delta = dragState.startY - e.clientY;
    setDragState(null);

    if (delta >= PLAY_THRESHOLD) {
      onPlayCard(cardId);
      onSelectCard(null);
    } else if (Math.abs(delta) < 8) {
      onSelectCard(selectedHandIndex === index ? null : index);
    }
  }

  return (
    <section aria-label="Main" className="panel hand-panel">
      {dragState && (
        <div aria-hidden="true" className={`hand-play-zone${isDragReady ? ' active' : ''}`} />
      )}

      {selectedCard && selectedCardId && (
        <div className="hand-action-strip">
          <div className="hand-action-btns">
            <button
              className="secondary-button hand-action-btn"
              onClick={() => onInspectCard(selectedCard)}
              type="button"
            >
              Voir
            </button>
            {game.activeCombat && (
              <button
                className="secondary-button hand-action-btn"
                disabled={discardDisabled}
                onClick={onDiscardForMana}
                type="button"
              >
                +1◆
              </button>
            )}
            {game.activeCombat && (
              <button
                className="hand-action-btn"
                disabled={Boolean(disabledReason)}
                onClick={() => { onPlayCard(selectedCardId); onSelectCard(null); }}
                title={disabledReason ?? undefined}
                type="button"
              >
                Jouer
              </button>
            )}
            <button
              className="secondary-button hand-action-btn"
              onClick={() => onSelectCard(null)}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="hand-fan">
        {game.hand.map((cardId, index) => {
          const cardRaw = getAction(cardId);
          if (!cardRaw) return null;
          const card = resolveCardForDisplay(cardRaw, game.flippedCards);
          const isSelected = index === selectedHandIndex;
          const isDraggingThis = dragState?.cardId === cardId;
          const cardDisabledReason = getCardDisabledReason(card, game, selectedEnemyInstanceId);
          const zIdx = isDraggingThis || isSelected ? 30 : Math.max(1, Math.round(10 - Math.abs(index - mid) * 2));

          return (
            <button
              aria-label={`Carte, cout ${formatValue(card.manaCost)}`}
              aria-pressed={isSelected}
              className={`hand-tile ${card.kind}${isSelected ? ' selected' : ''}${cardDisabledReason ? ' disabled-card' : ''}`}
              key={`${cardId}-${index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onPointerCancel={() => setDragState(null)}
              onPointerDown={(e) => handlePointerDown(e, cardId)}
              onPointerMove={(e) => handlePointerMove(e, cardId)}
              onPointerUp={(e) => handlePointerUp(e, cardId, index)}
              style={{
                transform: getFanTransform(index, isSelected, isDraggingThis),
                zIndex: zIdx,
                transition: isDraggingThis ? 'none' : undefined,
              }}
              type="button"
            >
              <ActionCardContent card={card} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getCardDisabledReason(card: ActionCard, game: GameState, selectedEnemyInstanceId: string | null): string | null {
  if (!game.activeCombat) return null;
  if (game.combatFeedback) return 'Résolution de combat en cours.';
  if (game.activeCombat.phase !== 'player') return 'Attends la phase joueuse.';
  if (game.mana === null) return 'Lance d\'abord le dé de mana.';
  if (card.manaCost !== null && card.manaCost > game.mana) return `Coût ${card.manaCost}, mana disponible ${game.mana}.`;
  if (!selectedEnemyInstanceId) return 'Sélectionne une cible.';
  return null;
}
