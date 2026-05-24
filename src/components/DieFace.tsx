import { useEffect, useState } from 'react';

export function DieFace({ value, modifier }: { value: number; modifier?: string }) {
  const cls = `die-face${modifier ? ` ${modifier}` : ''}`;
  return <span className={cls} key={value}>{value}</span>;
}

export function RollingDie({ onSettle, duration = 700 }: { onSettle: () => void; duration?: number }) {
  const [value, setValue] = useState(() => Math.ceil(Math.random() * 6));

  useEffect(() => {
    const interval = window.setInterval(() => setValue(Math.ceil(Math.random() * 6)), 80);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      onSettle();
    }, duration);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, []);

  return (
    <div className="dice-roll">
      <span className="die-face" key={value}>{value}</span>
    </div>
  );
}
