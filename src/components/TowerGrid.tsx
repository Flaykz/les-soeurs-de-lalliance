import { chooseMovementDestination } from '../game/rules';
import type { GameState, TowerCell, TowerDefinition } from '../game/types';

export function TowerGrid({ game, isActiveTower, movementOptions, selectedPath, setGame, tower, animatedPosition, onDestinationClick }: {
  game: GameState;
  isActiveTower: boolean;
  movementOptions: TowerCell[];
  selectedPath: { cellIds: string[] } | null;
  setGame: (game: GameState) => void;
  tower: TowerDefinition;
  animatedPosition?: string;
  onDestinationClick?: (cellId: string) => void;
}) {
  const isAnimating = animatedPosition !== undefined;

  return (
    <div className="tower-grid" style={{ gridTemplateColumns: `repeat(${tower.columns}, minmax(0, 1fr))` }}>
      {tower.cells.map((cell) => {
        const isDestination = isActiveTower && movementOptions.some((option) => option.id === cell.id);
        const isPreviewedPath = isActiveTower && (selectedPath?.cellIds.includes(cell.id) ?? false);
        const effectivePosId = isAnimating ? animatedPosition : game.position;
        const isCurrent = isActiveTower && cell.id === effectivePosId;
        const isResolved = game.resolvedCells.includes(cell.id);

        return (
          <button
            className={`tower-cell ${isCurrent ? (isAnimating ? 'pawn-moving' : 'current') : ''} ${isResolved ? 'resolved' : ''} ${isDestination ? 'destination' : ''} ${isPreviewedPath ? 'previewed-path' : ''}`}
            disabled={!isDestination}
            key={cell.id}
            onClick={() => {
              if (onDestinationClick) {
                onDestinationClick(cell.id);
              } else {
                setGame(chooseMovementDestination(game, cell.id));
              }
            }}
            type="button"
          >
            <span className={`cell-icon ${cell.kind}`} aria-label={getCellLabel(cell.kind)} title={`${cell.label} (${cell.row + 1}.${cell.col + 1})`}>
              <CellIcon kind={cell.kind} enemyCount={cell.enemyCount} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CellIcon({ kind, enemyCount }: { kind: string; enemyCount?: number }) {
  // Bouclier avec épées croisées (comme sur la carte physique)
  if (kind === 'enemy') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* Bouclier en forme de coeur pointu */}
        <path d="M32 6 L54 14 L54 36 C54 50 32 60 32 60 C32 60 10 50 10 36 L10 14 Z" fill="currentColor" />
        {/* Lames des épées croisées (gris argenté) */}
        <line x1="18" y1="53" x2="47" y2="13" stroke="rgba(200,215,235,0.88)" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="46" y1="53" x2="17" y2="13" stroke="rgba(200,215,235,0.88)" strokeWidth="5.5" strokeLinecap="round" />
        {/* Pommels (or/orange) */}
        <circle cx="17" cy="54" r="5" fill="#f97316" />
        <circle cx="47" cy="54" r="5" fill="#f97316" />
        {/* Nombre — bas du bouclier */}
        <text x="32" y="51" textAnchor="middle" fontSize="24" fontWeight="900" fill="white" stroke="#171717" strokeWidth="3" paintOrder="stroke">{enemyCount ?? 1}</text>
      </svg>
    );
  }

  // Crâne (piège normal)
  if (kind === 'trap') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* Dôme crânien */}
        <ellipse cx="32" cy="26" rx="22" ry="21" fill="currentColor" />
        {/* Mâchoire */}
        <rect x="16" y="40" width="32" height="15" rx="5" fill="currentColor" />
        {/* Orbites */}
        <ellipse cx="23" cy="27" rx="7" ry="8" fill="#171717" opacity="0.72" />
        <ellipse cx="41" cy="27" rx="7" ry="8" fill="#171717" opacity="0.72" />
        {/* Cavité nasale */}
        <path d="M29 36 L32 32 L35 36 Z" fill="#171717" opacity="0.55" />
        {/* Séparateurs de dents */}
        <line x1="24" y1="40" x2="24" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
        <line x1="32" y1="40" x2="32" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
        <line x1="40" y1="40" x2="40" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
      </svg>
    );
  }

  // Crâne avec badge "A" (piège avancé — Kraam)
  if (kind === 'trap-advanced') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <ellipse cx="32" cy="26" rx="22" ry="21" fill="currentColor" />
        <rect x="16" y="40" width="32" height="15" rx="5" fill="currentColor" />
        <ellipse cx="23" cy="27" rx="7" ry="8" fill="#171717" opacity="0.72" />
        <ellipse cx="41" cy="27" rx="7" ry="8" fill="#171717" opacity="0.72" />
        <path d="M29 36 L32 32 L35 36 Z" fill="#171717" opacity="0.55" />
        <line x1="24" y1="40" x2="24" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
        <line x1="32" y1="40" x2="32" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
        <line x1="40" y1="40" x2="40" y2="55" stroke="#171717" strokeWidth="2.5" opacity="0.45" />
        {/* Badge "A" rouge — piège avancé */}
        <circle cx="50" cy="13" r="11" fill="#dc2626" />
        <text x="50" y="18" textAnchor="middle" fontSize="13" fontWeight="900" fill="white">A</text>
      </svg>
    );
  }

  // Casque de boss à cornes (comme sur la carte physique)
  if (kind === 'boss') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* Corne gauche */}
        <path d="M20 24 C18 18 10 10 14 4 C16 12 18 18 22 24" fill="currentColor" />
        {/* Corne droite */}
        <path d="M44 24 C46 18 54 10 50 4 C48 12 46 18 42 24" fill="currentColor" />
        {/* Corps du casque */}
        <path d="M16 24 Q16 16 32 14 Q48 16 48 24 L48 52 Q48 58 32 58 Q16 58 16 52 Z" fill="currentColor" />
        {/* Visière (fente sombre) */}
        <rect x="21" y="31" width="22" height="15" rx="2" fill="#171717" opacity="0.72" />
        {/* Barreau de visière */}
        <line x1="21" y1="38" x2="43" y2="38" stroke="currentColor" strokeWidth="2" opacity="0.38" />
      </svg>
    );
  }

  // Coffre au trésor
  if (kind === 'treasure') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* Corps du coffre */}
        <rect x="9" y="37" width="46" height="21" rx="3" fill="currentColor" />
        {/* Couvercle bombé */}
        <path d="M9 39 Q9 13 32 13 Q55 13 55 39 Z" fill="currentColor" opacity="0.87" />
        {/* Bande centrale (serrure) */}
        <rect x="9" y="33" width="46" height="8" rx="2" fill="currentColor" />
        {/* Séparation bande / corps */}
        <rect x="9" y="41" width="46" height="2" fill="#171717" opacity="0.28" />
        {/* Pentures latérales */}
        <rect x="9" y="33" width="7" height="25" rx="2" fill="#171717" opacity="0.32" />
        <rect x="48" y="33" width="7" height="25" rx="2" fill="#171717" opacity="0.32" />
        {/* Serrure */}
        <rect x="25" y="34" width="14" height="6" rx="3" fill="#171717" opacity="0.48" />
        <circle cx="32" cy="37" r="2.2" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }

  // Coffre avec badge "A" (trésor avancé)
  if (kind === 'treasure-advanced') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* Corps du coffre */}
        <rect x="9" y="37" width="46" height="21" rx="3" fill="currentColor" />
        {/* Couvercle bombé */}
        <path d="M9 39 Q9 13 32 13 Q55 13 55 39 Z" fill="currentColor" opacity="0.87" />
        {/* Bande centrale (serrure) */}
        <rect x="9" y="33" width="46" height="8" rx="2" fill="currentColor" />
        {/* Séparation bande / corps */}
        <rect x="9" y="41" width="46" height="2" fill="#171717" opacity="0.28" />
        {/* Pentures latérales */}
        <rect x="9" y="33" width="7" height="25" rx="2" fill="#171717" opacity="0.32" />
        <rect x="48" y="33" width="7" height="25" rx="2" fill="#171717" opacity="0.32" />
        {/* Serrure */}
        <rect x="25" y="34" width="14" height="6" rx="3" fill="#171717" opacity="0.48" />
        <circle cx="32" cy="37" r="2.2" fill="currentColor" opacity="0.9" />
        {/* Badge "A" — trésor avancé */}
        <circle cx="50" cy="13" r="11" fill="#b45309" />
        <text x="50" y="18" textAnchor="middle" fontSize="13" fontWeight="900" fill="white">A</text>
      </svg>
    );
  }

  return null;
}

export function getCellLabel(kind: string) {
  if (kind === 'treasure') return 'Tresor';
  if (kind === 'treasure-advanced') return 'Tresor avance';
  if (kind === 'trap') return 'Piege';
  if (kind === 'trap-advanced') return 'Piege avance';
  if (kind === 'enemy') return 'Ennemis';
  if (kind === 'boss') return 'Boss';
  return 'Case vide';
}
