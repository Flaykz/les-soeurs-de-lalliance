const TRAP_TABLE = [
  { rolls: [1], label: 'Piège Niv. 4', sub: 'lancer dé défense' },
  { rolls: [2], label: 'Piège Niv. 5', sub: 'lancer dé défense' },
  { rolls: [3], label: 'Piège Niv. 6', sub: 'lancer dé défense' },
  { rolls: [4], label: '−1 PV direct' },
  { rolls: [5], label: 'Défausser 1 carte de la main' },
  { rolls: [6], label: 'Défausser 5 cartes du deck' },
];

interface Props {
  highlightedRoll?: number;
}

export function TrapReferenceCard({ highlightedRoll }: Props) {
  return (
    <div className="trap-ref-card">
      <p className="trap-ref-title">Table du Piège</p>
      {TRAP_TABLE.map((row) => {
        const isHighlighted = highlightedRoll !== undefined && row.rolls.includes(highlightedRoll);
        return (
          <div
            key={row.rolls.join('-')}
            className={`trap-ref-row${isHighlighted ? ' highlighted' : ''}`}
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
