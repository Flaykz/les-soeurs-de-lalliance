import { useState } from 'react';
import { baseBosses, baseActions, baseEnemies, towerDefinitions } from '../data/baseSet';
import { createInitialGameState } from '../game/rules';
import type { GameState } from '../game/types';
import { animationSpeeds, type AnimationSpeed } from '../ui/animationConfig';
import { FlippableCardTile, TowerList } from './CardCatalog';
import { BossCardTile } from './BossCard';
import { DataEntryPanel } from './DataEntryPanel';
import { EnemyCardDisplay } from './EnemyCard';

interface BossSelectionProps {
  animationSpeed: AnimationSpeed;
  onAnimationSpeedChange: (speed: AnimationSpeed) => void;
  onStartGame: (state: GameState) => void;
}

export function BossSelection({ animationSpeed, onAnimationSpeedChange, onStartGame }: BossSelectionProps) {
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [useLocations, setUseLocations] = useState(false);
  const baseActionCards = baseActions.filter((card) => card.kind === 'action');
  const advancedActionCards = baseActions.filter((card) => card.kind === 'advanced-action');
  const normalTowers = towerDefinitions.filter((tower) => !tower.id.startsWith('boss-tower-'));

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">MVP boite de base</p>
        <h1>Choisis ton boss</h1>
        <p>La partie commencera avec le boss selectionne, le bon nombre de tours normales, puis la tour speciale du boss.</p>
        <div className="animation-speed-control">
          <label htmlFor="animation-speed">Vitesse des animations</label>
          <select id="animation-speed" value={animationSpeed} onChange={(event) => onAnimationSpeedChange(event.target.value as AnimationSpeed)}>
            {animationSpeeds.map((speed) => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
          </select>
        </div>
        <div className="game-option-row">
          <label>
            <input type="checkbox" checked={useLocations} onChange={(e) => setUseLocations(e.target.checked)} />
            {' '}Jouer avec les lieux (non implémenté — désactivé recommandé)
          </label>
        </div>
      </section>

      <section className="boss-selection" aria-label="Choix du boss">
        {baseBosses.map((boss) => (
          <BossCardTile
            boss={boss}
            key={boss.id}
            onStart={(id) => onStartGame(createInitialGameState(id, { useLocations }))}
          />
        ))}
      </section>

      <section className="setup-catalog" aria-label="Cartes et tours disponibles">
        <div className="data-entry-toggle-bar">
          <button
            className={showDataEntry ? 'primary-button' : 'secondary-button'}
            onClick={() => setShowDataEntry(v => !v)}
            type="button"
          >
            {showDataEntry ? '✕ Fermer la saisie niv.2' : '✎ Saisir le niveau 2 des cartes'}
          </button>
        </div>

        {showDataEntry && <DataEntryPanel />}
        <section className="panel">
          <p className="eyebrow">Cartes de base</p>
          <h2>Actions de base</h2>
          <div className="setup-card-grid">
            {baseActionCards.map((card) => <FlippableCardTile card={card} key={card.id} />)}
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Cartes achetables</p>
          <h2>Actions avancées</h2>
          <div className="setup-card-grid">
            {advancedActionCards.map((card) => <FlippableCardTile card={card} key={card.id} />)}
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Paquet ennemi</p>
          <h2>Ennemis</h2>
          <div className="setup-enemy-grid">
            {baseEnemies.map((enemy) => (
              <EnemyCardDisplay card={enemy} key={enemy.id} />
            ))}
          </div>
        </section>
        <TowerList title="Tours normales" towers={normalTowers} />
      </section>
    </main>
  );
}
