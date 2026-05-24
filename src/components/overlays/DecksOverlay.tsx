import { getAction } from '../../game/rules';
import type { ActionCard, GameState } from '../../game/types';
import { CardPeek, DiscardList } from '../CardCatalog';

interface Props {
  game: GameState;
  onClose: () => void;
  onBuyActionCard: () => void;
  onBuyAdvancedActionCard: (deckIndex: 0 | 1) => void;
  onBuyPotion: () => void;
  buyActionDisabledReason: string | null;
  onInspect?: (card: ActionCard) => void;
}

export function DecksOverlay({ game, onClose, onBuyActionCard, onBuyAdvancedActionCard, onBuyPotion, buyActionDisabledReason, onInspect }: Props) {
  const topActionCard = game.deck[0] ? getAction(game.deck[0]) ?? null : null;
  const topAdvancedCards = game.advancedDecks.map((deck) => deck[0] ? getAction(deck[0]) ?? null : null);

  return (
    <section aria-label="Paquets de cartes" className="overlay-panel">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="overlay-card side-overlay">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Paquets</p>
            <h2>Cartes visibles</h2>
          </div>
          <button className="secondary-button" onClick={onClose}>Fermer</button>
        </div>
        <div className="deck-summary" aria-label="Paquets de cartes">
          <div>
            <p className="eyebrow">Deck action</p>
            <h2>{game.deck.length} carte(s)</h2>
            <CardPeek card={topActionCard} emptyLabel="Deck vide" onInspect={onInspect} />
            {game.activeCombat && (
              <button disabled={Boolean(buyActionDisabledReason)} onClick={onBuyActionCard}>
                Acheter pour 1 mana
              </button>
            )}
            {game.activeCombat && buyActionDisabledReason && (
              <p className="muted">{buyActionDisabledReason}</p>
            )}
          </div>
          {topAdvancedCards.map((card, index) => (
            <div key={`advanced-deck-${index}`}>
              <p className="eyebrow">Deck avance {index + 1}</p>
              <h2>{game.advancedDecks[index].length} carte(s)</h2>
              <CardPeek card={card} emptyLabel="Deck avance vide" onInspect={onInspect} />
              <button
                disabled={!card || game.xp < 2 || game.hand.length >= 5 || Boolean(game.combatFeedback)}
                onClick={() => onBuyAdvancedActionCard(index as 0 | 1)}
              >
                Recuperer pour 2 XP
              </button>
            </div>
          ))}
          <div>
            <p className="eyebrow">Defausse</p>
            <h2>{game.discard.length} carte(s)</h2>
            <DiscardList discard={game.discard} onInspect={onInspect} />
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
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
