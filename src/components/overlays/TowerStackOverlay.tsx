import { getTower } from '../../game/rules';
import type { GameState, TowerDefinition } from '../../game/types';
import { TowerGrid } from '../TowerGrid';

interface Props {
  game: GameState;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

export function TowerStackOverlay({ game, onClose, setGame }: Props) {
  const towerStack = game.towerIds
    .map((towerId, sequenceIndex) => ({ tower: getTower(towerId), sequenceIndex }))
    .filter((entry): entry is { tower: TowerDefinition; sequenceIndex: number } => Boolean(entry.tower));

  return (
    <section className="overlay-panel tower-overview" aria-label="Vue strategie des tours">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="overlay-card wide-overlay">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Planification</p>
            <h2>Toutes les tours de la partie</h2>
          </div>
          <button className="secondary-button" onClick={onClose}>Fermer</button>
        </div>
        <div className="tower-stack">
          {[...towerStack].reverse().map(({ tower, sequenceIndex }) => {
            const towerStatus = sequenceIndex < game.currentTowerIndex
              ? 'completed'
              : sequenceIndex > game.currentTowerIndex
                ? 'upcoming'
                : 'active';
            return (
              <article className={`tower-card ${towerStatus}`} key={`${tower.id}-${sequenceIndex}`}>
                <div className="tower-heading">
                  <p className="eyebrow">
                    {tower.id.startsWith('boss-tower-') ? 'Tour boss' : 'Tour normale'}{' '}
                    {sequenceIndex + 1}/{game.towerIds.length}
                  </p>
                  <h3>{tower.name}</h3>
                </div>
                <TowerGrid
                  game={game}
                  isActiveTower={false}
                  movementOptions={[]}
                  selectedPath={null}
                  setGame={setGame}
                  tower={tower}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
