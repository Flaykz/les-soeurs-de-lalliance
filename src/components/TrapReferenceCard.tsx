const TRAP_TABLE = [
  { rolls: [1], label: 'Piège Niv. 4', sub: 'lancer dé défense' },
  { rolls: [2], label: 'Piège Niv. 5', sub: 'lancer dé défense' },
  { rolls: [3], label: 'Piège Niv. 6', sub: 'lancer dé défense' },
  { rolls: [4], label: '−1 PV direct' },
  { rolls: [5], label: 'Défausser 1 carte de la main' },
  { rolls: [6], label: 'Défausser 5 cartes du deck' },
];

const SCAN_STEP_MS = 220;
const SCAN_LINGER_MS = 900;

interface Props {
  highlightedRoll?: number;
  scanning?: boolean;
}

export function TrapReferenceCard({ highlightedRoll, scanning }: Props) {
  const targetRowIndex = highlightedRoll !== undefined
    ? TRAP_TABLE.findIndex((row) => row.rolls.includes(highlightedRoll))
    : -1;

  return (
    <div className="trap-ref-card">
      <p className="trap-ref-title">Table du Piège</p>
      {TRAP_TABLE.map((row, index) => {
        const isTarget = highlightedRoll !== undefined && row.rolls.includes(highlightedRoll);
        const isScanRow = scanning && targetRowIndex !== -1 && index <= targetRowIndex;

        let scanDelay: string | undefined;
        if (scanning && isScanRow) {
          const delayMs = index < targetRowIndex
            ? index * SCAN_STEP_MS
            : index * SCAN_STEP_MS;
          scanDelay = `${delayMs}ms`;
        }

        return (
          <div
            key={row.rolls.join('-')}
            className={[
              'trap-ref-row',
              isTarget ? 'highlighted' : '',
              scanning && isScanRow && !isTarget ? 'scan-pass' : '',
              scanning && isTarget ? 'scan-land' : '',
            ].filter(Boolean).join(' ')}
            style={scanDelay ? { '--scan-delay': scanDelay } as React.CSSProperties : undefined}
          >
            <span className="trap-ref-dice">
              {row.rolls.map(r => (
                <span key={r} className="trap-ref-die">{r}</span>
              ))}
            </span>
            <span className="trap-ref-label">
              {row.label}
              {row.sub && <span className="trap-ref-sub">{row.sub}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
