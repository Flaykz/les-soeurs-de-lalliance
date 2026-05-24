import { useState } from 'react';
import { towerDefinitions } from '../data/tower';
import type { BossCard, TowerDefinition } from '../game/types';
import { formatValue } from '../ui/formatters';
import { CellIcon, getCellLabel } from './TowerGrid';

interface BossCardTileProps {
  boss: BossCard;
  onStart: (bossId: string) => void;
}

export function BossCardTile({ boss, onStart }: BossCardTileProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x2 = (boss.healthGaugeRepeats ?? 1) >= 2;
  const bossTower = towerDefinitions.find((t) => t.id === boss.bossTowerId) ?? null;

  if (isFlipped && bossTower) {
    return (
      <article className="boss-card-tile boss-card-tile--back" key="back">
        <div className="boss-card-top-bar">
          <p className="boss-card-eyebrow">Tour spéciale</p>
          <h2 className="boss-card-name">{boss.name}</h2>
          <button
            aria-label="Retourner la carte"
            className="boss-flip-btn"
            onClick={() => setIsFlipped(false)}
            title="Voir les stats (recto)"
            type="button"
          >
            ↩
          </button>
        </div>
        <StaticTowerPreview tower={bossTower} />
        <button className="boss-start-btn" onClick={() => onStart(boss.id)} type="button">
          Affronter {boss.name}
        </button>
      </article>
    );
  }

  return (
    <article className="boss-card-tile boss-card-tile--front" key="front">
      <div className="boss-card-top-bar">
        <p className="boss-card-eyebrow">Boss</p>
        <h2 className="boss-card-name">{boss.name}</h2>
        {boss.keyword && <span className="boss-keyword-badge">{boss.keyword}</span>}
        {bossTower && (
          <button
            aria-label="Voir la tour spéciale"
            className="boss-flip-btn"
            onClick={() => setIsFlipped(true)}
            title="Voir la tour spéciale (verso)"
            type="button"
          >
            ↩
          </button>
        )}
      </div>

      <div className="boss-card-body">
        <div className="boss-card-art" aria-hidden="true">⚔</div>
        <div className="boss-card-main">
          <div className="boss-card-stats">
            <div className="boss-stat-bubble attack-bubble">
              <span className="bubble-value">{formatValue(boss.attack)}</span>
              <span className="bubble-label">⚔ ATK</span>
            </div>
            <div className="boss-towers-pill">
              <span className="boss-towers-value">{formatValue(boss.normalTowerCount)}</span>
              <span className="boss-towers-label">tours</span>
            </div>
          </div>
          <div className="boss-health-section">
            <p className="boss-health-label">
              ♥ Jauge de santé
              {x2 && <span className="boss-x2-badge">×2</span>}
            </p>
            <div className="boss-health-dice">
              {boss.healthDice.map((die, i) => (
                <span
                  className={`boss-die hp-bubble${die === '?' ? ' boss-die-unknown' : ''}`}
                  key={i}
                  aria-label={die === '?' ? 'valeur inconnue' : String(die)}
                >
                  {die}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="boss-start-btn" onClick={() => onStart(boss.id)} type="button">
        Affronter {boss.name}
      </button>
    </article>
  );
}

export function StaticTowerPreview({ tower }: { tower: TowerDefinition }) {
  return (
    <div
      className="boss-tower-preview"
      style={{ gridTemplateColumns: `repeat(${tower.columns}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`Tour ${tower.name}`}
    >
      {tower.cells.map((cell) => (
        <div
          className={`boss-preview-cell ${cell.kind}`}
          key={cell.id}
          title={cell.kind !== 'empty' ? cell.label : undefined}
        >
          {cell.kind !== 'empty' && (
            <span className={`cell-icon ${cell.kind}`} aria-label={getCellLabel(cell.kind)}>
              <CellIcon kind={cell.kind} enemyCount={cell.enemyCount} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
