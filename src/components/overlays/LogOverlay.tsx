import type { GameState } from '../../game/types';

interface Props {
  game: GameState;
  onClose: () => void;
}

export function LogOverlay({ game, onClose }: Props) {
  return (
    <section className="overlay-panel" aria-label="Journal d'evenements">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="overlay-card side-overlay log-panel">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Journal</p>
            <h2>Evenements</h2>
          </div>
          <button className="secondary-button" onClick={onClose}>Fermer</button>
        </div>
        <ol className="log-list">
          {game.log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
        </ol>
      </div>
    </section>
  );
}
