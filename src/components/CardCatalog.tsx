import { useState } from 'react';
import { getAction } from '../game/rules';
import { resolveCardForDisplay } from '../game/data-access';
import type { ActionCard, TowerDefinition } from '../game/types';
import { formatActionEffects, formatValue, getCardMeta, getEffectDisplays, type CardSummary } from '../ui/formatters';
import { StaticTowerPreview } from './BossCard';

export function CardList({ title, eyebrow, items }: { title: string; eyebrow?: string; items: CardSummary[] }) {
  return (
    <section className="panel">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      <div className="cards compact-cards">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <p className="card-type">{getCardMeta(item)}</p>
            {'name' in item && item.name && <h3>{item.name}</h3>}
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TowerList({ title, towers }: { title: string; towers: TowerDefinition[] }) {
  return (
    <section className="panel">
      <p className="eyebrow">Plateau</p>
      <h2>{title}</h2>
      <div className="setup-tower-grid">
        {towers.map((tower) => <TowerCardTile tower={tower} key={tower.id} />)}
      </div>
    </section>
  );
}

function TowerCardTile({ tower }: { tower: TowerDefinition }) {
  const enemyCount = tower.cells.reduce((total, cell) => total + (cell.kind === 'enemy' ? cell.enemyCount ?? 1 : 0), 0);
  const trapCount = tower.cells.filter((cell) => cell.kind === 'trap' || cell.kind === 'trap-advanced').length;
  const advTrapCount = tower.cells.filter((cell) => cell.kind === 'trap-advanced').length;
  const treasureCount = tower.cells.filter((cell) => cell.kind === 'treasure' || cell.kind === 'treasure-advanced').length;
  const advTreasureCount = tower.cells.filter((cell) => cell.kind === 'treasure-advanced').length;

  return (
    <article className="tower-card-tile">
      <div className="tower-card-header">
        <span className="tower-card-dims">{tower.rows}×{tower.columns}</span>
        <h3 className="tower-card-name">{tower.name}</h3>
      </div>
      <div className="tower-card-preview">
        <StaticTowerPreview tower={tower} />
      </div>
      <div className="tower-card-stats">
        {enemyCount > 0 && (
          <span className="tower-stat tower-stat--enemy">{enemyCount} ennemi{enemyCount > 1 ? 's' : ''}</span>
        )}
        {trapCount > 0 && (
          <span className="tower-stat tower-stat--trap">
            {trapCount} piège{trapCount > 1 ? 's' : ''}{advTrapCount > 0 ? ` (${advTrapCount} A)` : ''}
          </span>
        )}
        {treasureCount > 0 && (
          <span className="tower-stat tower-stat--treasure">
            {treasureCount} trésor{treasureCount > 1 ? 's' : ''}{advTreasureCount > 0 ? ` (${advTreasureCount} A)` : ''}
          </span>
        )}
      </div>
    </article>
  );
}

export function ActionCardContent({ card, isLevel2 }: { card: ActionCard; isLevel2?: boolean }) {
  const kindLabel = isLevel2
    ? (card.kind === 'advanced-action' ? 'A2' : '2')
    : (card.kind === 'advanced-action' ? 'A1' : '1');
  return (
    <>
      <span className="mana-chip">{formatValue(card.manaCost)}</span>
      <span className={`hand-card-kind${isLevel2 ? ' level-2' : ''}`}>{kindLabel}</span>
      <div className="hand-card-bottom">
        <div className="effect-row">
          {getEffectDisplays(card).map(({ label: l, kind }, i) => (
            <span className={`effect-badge effect-${kind}`} key={i}>{l}</span>
          ))}
        </div>
      </div>
    </>
  );
}

export function FlippableCardTile({ card }: { card: ActionCard }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const canFlip = !!card.level2;
  const fakeFlippedCards = isFlipped ? [card.id] : [];
  const resolved = resolveCardForDisplay(card, fakeFlippedCards);
  const label = `${isFlipped ? 'Niv. 2, ' : ''}cout ${formatValue(resolved.manaCost)}, ${formatActionEffects(resolved)}`;

  return (
    <div className="flippable-card-wrapper">
      <article aria-label={label} className={`hand-tile ${card.kind}${isFlipped ? ' flipped-preview' : ''}`}>
        <ActionCardContent card={resolved} isLevel2={isFlipped} />
      </article>
      {canFlip && (
        <button
          aria-label={isFlipped ? 'Voir face 1' : 'Voir face 2'}
          className="flip-toggle-btn"
          onClick={() => setIsFlipped((v) => !v)}
          title={isFlipped ? 'Face 1' : 'Face 2 disponible'}
          type="button"
        >
          {isFlipped ? '1' : '2'}
        </button>
      )}
    </div>
  );
}

export function ActionCardTile({ card, onInspect }: { card: ActionCard; onInspect?: (card: ActionCard) => void }) {
  const label = `Carte, cout ${formatValue(card.manaCost)}, ${formatActionEffects(card)}`;

  if (onInspect) {
    return (
      <button
        aria-label={label}
        className={`hand-tile ${card.kind} playable-card`}
        onClick={() => onInspect(card)}
        type="button"
      >
        <ActionCardContent card={card} />
      </button>
    );
  }

  return (
    <article aria-label={label} className={`hand-tile ${card.kind}`}>
      <ActionCardContent card={card} />
    </article>
  );
}

export function CardPeek({ card, emptyLabel, onInspect }: { card: ActionCard | null; emptyLabel: string; onInspect?: (card: ActionCard) => void }) {
  if (!card) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return <ActionCardTile card={card} onInspect={onInspect} />;
}

export function DiscardList({ discard, onInspect }: { discard: string[]; onInspect?: (card: ActionCard) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (discard.length === 0) {
    return <p className="muted">Aucune carte defaussee.</p>;
  }

  const topCard = getAction(discard[discard.length - 1]);

  if (!expanded) {
    return (
      <div className="discard-stack">
        <button
          aria-label="Voir toutes les cartes defaussees"
          className="discard-top-trigger"
          onClick={() => setExpanded(true)}
          type="button"
        >
          {topCard && <ActionCardTile card={topCard} />}
          {discard.length > 1 && (
            <span className="discard-count-badge">+{discard.length - 1}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="discard-expanded">
      <button className="secondary-button discard-collapse-btn" onClick={() => setExpanded(false)} type="button">
        Replier
      </button>
      <div className="discard-tile-strip">
        {[...discard].reverse().map((cardId, index) => {
          const card = getAction(cardId);
          if (!card) return null;
          return <ActionCardTile card={card} key={`${cardId}-${index}`} onInspect={onInspect} />;
        })}
      </div>
    </div>
  );
}

