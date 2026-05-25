const TREASURE_TABLE = [
  { rolls: [1], label: 'Récupérer une carte du deck' },
  { rolls: [2], label: 'Récupérer une carte de la défausse' },
  { rolls: [3], label: '+1 XP' },
  { rolls: [4], label: '+2 XP' },
  { rolls: [5, 6], label: '+1 Potion de vie' },
];

const TREASURE_ADVANCED_TABLE = [
  { rolls: [1], label: 'Récupérer jusqu\'à 2 cartes du deck' },
  { rolls: [2], label: 'Récupérer jusqu\'à 2 cartes de la défausse' },
  { rolls: [3], label: '+2 XP' },
  { rolls: [4], label: '+3 XP' },
  { rolls: [5], label: '+1 Potion de vie' },
  { rolls: [6], label: '+2 Potions de vie' },
];

interface Props {
  advanced?: boolean;
  highlightedRoll?: number;
}

export function TreasureReferenceCard({ advanced, highlightedRoll }: Props) {
  const table = advanced ? TREASURE_ADVANCED_TABLE : TREASURE_TABLE;
  return (
    <div className="treasure-ref-card">
      <p className="treasure-ref-title">{advanced ? 'Table du Trésor avancé' : 'Table du Trésor'}</p>
      {table.map((row) => {
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
