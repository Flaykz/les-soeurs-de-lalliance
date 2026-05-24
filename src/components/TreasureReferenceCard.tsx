const TREASURE_TABLE = [
  { rolls: [1], label: 'Récupérer une carte du deck' },
  { rolls: [2], label: 'Récupérer une carte de la défausse' },
  { rolls: [3], label: '+1 XP' },
  { rolls: [4], label: '+2 XP' },
  { rolls: [5, 6], label: '+1 Potion de vie' },
];

interface Props {
  highlightedRoll?: number;
}

export function TreasureReferenceCard({ highlightedRoll }: Props) {
  return (
    <div className="treasure-ref-card">
      <p className="treasure-ref-title">Table du Trésor</p>
      {TREASURE_TABLE.map((row) => {
        const isHighlighted = highlightedRoll !== undefined && row.rolls.includes(highlightedRoll);
        return (
          <div
            key={row.rolls.join('-')}
            className={`treasure-ref-row${isHighlighted ? ' highlighted' : ''}`}
          >
            <span className="treasure-ref-dice">
              {row.rolls.map(r => (
                <span key={r} className="treasure-ref-die">{r}</span>
              ))}
            </span>
            <span className="treasure-ref-label">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}
