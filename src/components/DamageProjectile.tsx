import { useEffect, useRef, useState } from 'react';
import type { PlayerFeedback } from '../game/types';

const PROJ_DURATION_MS = 400;

type Proj = { x1: number; y1: number; x2: number; y2: number; key: number; delay: number };

export function DamageProjectile({ feedback }: { feedback: PlayerFeedback | null }) {
  const [projs, setProjs] = useState<Proj[]>([]);
  const batchRef = useRef(0);

  useEffect(() => {
    if (!feedback || feedback.net <= 0 || !feedback.hits?.length) {
      setProjs([]);
      return;
    }
    const playerEl = document.querySelector<Element>('[data-player-card]');
    if (!playerEl) return;

    const pr = playerEl.getBoundingClientRect();
    const batch = ++batchRef.current;

    const next: Proj[] = [];
    feedback.hits.forEach(({ instanceId }, i) => {
      const enemyEl = document.querySelector<Element>(`[data-enemy-id="${instanceId}"]`);
      if (!enemyEl) return;
      const er = enemyEl.getBoundingClientRect();
      next.push({
        x1: er.left + er.width / 2,
        y1: er.top + er.height / 2,
        x2: pr.left + pr.width / 2,
        y2: pr.top + pr.height / 2,
        key: batch * 100 + i,
        delay: i * PROJ_DURATION_MS,
      });
    });

    setProjs(next);
  }, [feedback]);

  if (!projs.length) return null;

  return (
    <>
      {projs.map(({ x1, y1, x2, y2, key, delay }) => (
        <div
          key={key}
          className="damage-projectile"
          style={{
            '--proj-x1': `${x1}px`,
            '--proj-y1': `${y1}px`,
            '--proj-x2': `${x2}px`,
            '--proj-y2': `${y2}px`,
            '--proj-delay': `${delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
