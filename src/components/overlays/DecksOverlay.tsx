import { getAction } from '../../game/rules';
import type { ActionCard, GameState } from '../../game/types';
import { CardPeek, DiscardList } from '../CardCatalog';

interface Props {
  game: GameState;
  onClose: () => void;
  onBuyActionCard: () => void;
  onBuyAdvancedActionCard: (deckIndex: 0 | 1) => void;
  onCycleAdvancedDeckCard: (deckIndex: 0 | 1) => void;
  onBuyPotion: () => void;
  buyActionDisabledReason: string | null;
  onInspect?: (card: ActionCard) => void;
}

export function DecksOverlay({ game, onClose, onBuyActionCard, onBuyAdvancedActionCard, onCycleAdvancedDeckCard, onBuyPotion, buyActionDisabledReason, onInspect }: Props) {
  const topActionCard = game.deck[0] ? getAction(game.deck[0]) ?? null : null;
  const topAdvancedCards = game.advancedDecks.map((deck) => deck[0] ? getAction(deck[0]) ?? null : null);

  const inPlayerPhase = Boolean(
    (game.activeCombat?.phase === 'player' && !game.combatFeedback)
    || (game.activeBossCombat?.phase === 'player' && !game.bossCombatFeedback)
  );

  return (
    <section aria-label="Paquets de cartes" className="overlay-panel">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="overlay-card side-overlay decks-overlay">
        <div className="decks-overlay-handle" />
        <div className="panel-heading-row">
          <div className="decks-overlay-title">
            <h2>Cartes visibles</h2>
            <div className="decks-overlay-resources">
              {game.mana !== null && (
                <span className="resource-chip resource-chip--mana">◆ {game.mana}</span>
              )}
              <span className="resource-chip resource-chip--xp">{game.xp} XP</span>
            </div>
          </div>
          <button className="secondary-button" onClick={onClose}>Fermer</button>
        </div>

        <div className="deck-summary">
          <div className="deck-summary-row">
            <div className="deck-slot">
              <div className="deck-slot-header">
                <span className="eyebrow">Deck action</span>
                <span className="deck-slot-count">{game.deck.length}</span>
              </div>
              <CardPeek card={topActionCard} emptyLabel="Vide" onInspect={onInspect} />
              {inPlayerPhase && topActionCard && (
                <button
                  className="deck-action-btn deck-action-btn--buy"
                  disabled={Boolean(buyActionDisabledReason)}
                  onClick={onBuyActionCard}
                  title={buyActionDisabledReason ?? undefined}
                >
                  Acheter · 1◆
                </button>
              )}
            </div>

            <div className="deck-slot deck-slot--discard">
              <div className="deck-slot-header">
                <span className="eyebrow">Défausse</span>
                <span className="deck-slot-count">{game.discard.length}</span>
              </div>
              <DiscardList discard={game.discard} onInspect={onInspect} />
            </div>
          </div>

          <div className="deck-summary-row">
            {topAdvancedCards.map((card, index) => (
              <div key={`advanced-deck-${index}`} className="deck-slot deck-slot--aa">
                <div className="deck-slot-header">
                  <span className="eyebrow">Deck AA {index + 1}</span>
                  <span className="deck-slot-count">{game.advancedDecks[index].length}</span>
                </div>
                <CardPeek card={card} emptyLabel="Vide" onInspect={onInspect} />
                <button
                  className="deck-action-btn deck-action-btn--buy"
                  disabled={!card || game.xp < 2 || game.hand.length >= 5 || Boolean(game.combatFeedback)}
                  onClick={() => onBuyAdvancedActionCard(index as 0 | 1)}
                >
                  Acheter · 2 XP
                </button>
                {card && inPlayerPhase && (
                  <button
                    className="deck-action-btn deck-action-btn--cycle"
                    disabled={(game.mana ?? 0) < 1}
                    onClick={() => { onCycleAdvancedDeckCard(index as 0 | 1); onClose(); }}
                  >
                    Passer · 1◆
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="decks-overlay-footer">
          <button
            className="deck-action-btn deck-action-btn--potion"
            disabled={game.xp < 3 || game.potions >= 3}
            onClick={() => { onBuyPotion(); onClose(); }}
          >
            ✚ Acheter une potion · 3 XP
          </button>
        </div>
      </div>
    </section>
  );
}
