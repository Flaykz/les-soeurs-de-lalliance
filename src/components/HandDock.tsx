import { useState } from 'react';
import { getAction, resolveCardForDisplay } from '../game/rules';
import type { ActionCard, GameState } from '../game/types';
import { ActionCardContent } from './CardCatalog';

function getTopDeckManaCost(game: GameState): number | undefined {
  const topId = game.deck[0];
  if (!topId) return undefined;
  const top = getAction(topId);
  if (!top) return undefined;
  return resolveCardForDisplay(top, game.flippedCards).manaCost ?? undefined;
}

const FAN_ANGLE = 3;
const PLAY_THRESHOLD = 100;
const VISUAL_DRAG_THRESHOLD = 8;

export function HandDock({ game, onPlayCard, onInspectCard, onDiscardForTrap, unaffordableCardIds = new Set(), trapDiscardAnimCardId, canDiscardForMana = false }: {
  game: GameState;
  onPlayCard: (cardId: string) => void;
  onInspectCard: (card: ActionCard, handIndex: number) => void;
  onDiscardForTrap?: (cardId: string, handIndex: number) => void;
  unaffordableCardIds?: Set<string>;
  trapDiscardAnimCardId?: string;
  canDiscardForMana?: boolean;
}) {
  const [dragState, setDragState] = useState<{ cardId: string; startY: number; currentY: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const trapMode = Boolean(onDiscardForTrap);
  const dragDeltaY = dragState ? Math.max(0, dragState.startY - dragState.currentY) : 0;
  const isDragReady = dragDeltaY >= PLAY_THRESHOLD;

  const topDeckManaCost = getTopDeckManaCost(game);
  const n = game.hand.length;
  const mid = (n - 1) / 2;

  function getFanTransform(index: number, isDraggingThis: boolean): string {
    if (isDraggingThis && dragDeltaY > VISUAL_DRAG_THRESHOLD) {
      return `rotate(0deg) translateY(${-(Math.min(dragDeltaY - VISUAL_DRAG_THRESHOLD, 220))}px)`;
    }
    if (hoveredIndex === index) return 'rotate(0deg) translateY(-50px)';
    const rot = (index - mid) * FAN_ANGLE;
    return `rotate(${rot}deg) translateY(0px)`;
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

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>, cardId: string, index: number, card: ActionCard) {
    e.preventDefault();
    if (!dragState || dragState.cardId !== cardId) {
      setDragState(null);
      return;
    }
    const delta = dragState.startY - e.clientY;
    setDragState(null);

    if (trapMode) {
      onDiscardForTrap!(cardId, index);
    } else if (delta >= PLAY_THRESHOLD) {
      onPlayCard(cardId);
    } else {
      onInspectCard(card, index);
    }
  }

  return (
    <section aria-label="Main" className="panel hand-panel">
      {dragState && !trapMode && (
        <div aria-hidden="true" className={`hand-play-zone${isDragReady ? ' active' : ''}`} />
      )}
      <div className="hand-fan">
        {game.hand.map((cardId, index) => {
          const cardRaw = getAction(cardId);
          if (!cardRaw) return null;
          const card = resolveCardForDisplay(cardRaw, game.flippedCards);
          const isDraggingThis = dragState?.cardId === cardId;
          const zIdx = isDraggingThis ? 30 : Math.max(1, Math.round(10 - Math.abs(index - mid) * 2));
          const isUnaffordable = unaffordableCardIds.has(cardId);
          const isTrapDiscard = cardId === trapDiscardAnimCardId;

          const classes = [
            'hand-tile',
            card.kind,
            isUnaffordable ? 'unaffordable' : '',
            trapMode ? 'discard-ready' : '',
            (!trapMode && canDiscardForMana) ? 'mana-discard-ready' : '',
            isTrapDiscard ? 'trap-discard-anim' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              aria-label={trapMode ? `Défausser, coût ${card.manaCost ?? 0} mana` : `Carte, coût ${card.manaCost ?? '?'}`}
              className={classes}
              key={`${cardId}-${index}`}
              onPointerCancel={() => setDragState(null)}
              onPointerDown={(e) => handlePointerDown(e, cardId)}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHoveredIndex(index); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHoveredIndex(null); }}
              onPointerMove={(e) => handlePointerMove(e, cardId)}
              onPointerUp={(e) => handlePointerUp(e, cardId, index, card)}
              style={{
                transform: getFanTransform(index, isDraggingThis),
                zIndex: zIdx,
                transition: isDraggingThis ? 'none' : undefined,
              }}
              type="button"
            >
              <ActionCardContent card={card} isLevel2={game.flippedCards.includes(cardId)} topDeckManaCost={topDeckManaCost} />
              {trapMode && (
                <span className="discard-ready-badge" aria-hidden="true">↓</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
