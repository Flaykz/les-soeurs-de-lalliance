import { useState } from 'react';
import { baseBosses } from '../data/baseSet';
import { createInitialGameState } from '../game/rules';
import type { GameState } from '../game/types';
import { animationSpeeds, type AnimationSpeed } from '../ui/animationConfig';
import { BossCardTile } from './BossCard';

interface BossSelectionProps {
  animationSpeed: AnimationSpeed;
  onAnimationSpeedChange: (speed: AnimationSpeed) => void;
  onStartGame: (state: GameState) => void;
  onOpenMenu: () => void;
}

export function BossSelection({ animationSpeed, onAnimationSpeedChange, onStartGame, onOpenMenu }: BossSelectionProps) {
  const [useLocations, setUseLocations] = useState(false);

  return (
    <main className="shell">
      <div className="boss-selection-topbar">
        <button
          className="main-menu-trigger"
          onClick={onOpenMenu}
          title="Menu"
          aria-label="Menu"
          type="button"
        >
          ☰
        </button>
      </div>

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
    </main>
  );
}
