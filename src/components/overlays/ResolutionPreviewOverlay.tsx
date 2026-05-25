import { Fragment, type CSSProperties, useEffect, useRef } from 'react';
import type { TowerCell } from '../../game/types';

export type PreviewEvent =
  | { kind: 'trap'; advanced: boolean }
  | { kind: 'combat'; enemyCount: number }
  | { kind: 'treasure'; advanced: boolean }
  | { kind: 'boss' };

const CHIP_STAGGER_MS = 320;

export function computePreviewEvents(cells: TowerCell[]): PreviewEvent[] {
  const events: PreviewEvent[] = [];

  for (const cell of cells) {
    if (cell.kind === 'trap' || cell.kind === 'trap-advanced') {
      events.push({ kind: 'trap', advanced: cell.kind === 'trap-advanced' });
    }
  }

  const totalEnemies = cells
    .filter(c => c.kind === 'enemy')
    .reduce((sum, c) => sum + (c.enemyCount ?? 1), 0);
  for (let i = 0; i < totalEnemies; i += 3) {
    events.push({ kind: 'combat', enemyCount: Math.min(3, totalEnemies - i) });
  }

  for (const cell of cells) {
    if (cell.kind === 'treasure' || cell.kind === 'treasure-advanced') {
      events.push({ kind: 'treasure', advanced: cell.kind === 'treasure-advanced' });
    }
  }

  if (cells.some(c => c.kind === 'boss')) {
    events.push({ kind: 'boss' });
  }

  return events;
}

function chipIcon(event: PreviewEvent): string {
  switch (event.kind) {
    case 'trap': return event.advanced ? '💀' : '☠️';
    case 'combat': return '⚔️';
    case 'treasure': return event.advanced ? '✨' : '💎';
    case 'boss': return '👑';
  }
}

function chipLabel(event: PreviewEvent): string {
  switch (event.kind) {
    case 'trap': return event.advanced ? 'Piège avancé' : 'Piège';
    case 'combat': return `${event.enemyCount} ${event.enemyCount === 1 ? 'ennemi' : 'ennemis'}`;
    case 'treasure': return event.advanced ? 'Trésor rare' : 'Trésor';
    case 'boss': return 'Boss';
  }
}

export function ResolutionPreviewOverlay({
  events,
  onDismiss,
}: {
  events: PreviewEvent[];
  onDismiss: () => void;
}) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const autoDismissMs = (events.length - 1) * CHIP_STAGGER_MS + 1600;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismissRef.current(), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs]);

  const hintDelayMs = (events.length - 1) * CHIP_STAGGER_MS + 600;

  return (
    <div
      aria-label="Événements à résoudre"
      aria-modal="true"
      className="rp-overlay"
      role="dialog"
      onClick={onDismiss}
    >
      <p className="rp-label">À résoudre</p>
      <div className="rp-events">
        {events.map((event, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span
                className="rp-separator"
                style={{ animationDelay: `${i * CHIP_STAGGER_MS - 80}ms` } as CSSProperties}
              >
                →
              </span>
            )}
            <div
              className={`rp-chip rp-chip--${event.kind}`}
              style={{ animationDelay: `${i * CHIP_STAGGER_MS}ms` } as CSSProperties}
            >
              <span aria-hidden="true" className="rp-chip-icon">{chipIcon(event)}</span>
              <span className="rp-chip-label">{chipLabel(event)}</span>
            </div>
          </Fragment>
        ))}
      </div>
      <p
        className="rp-hint"
        style={{ animationDelay: `${hintDelayMs}ms` } as CSSProperties}
      >
        Touchez pour continuer
      </p>
    </div>
  );
}
