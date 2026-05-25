import type { ActionCard } from '../game/types';

// Coûts Mana et effets principaux issus du PDF (Chapitre 1, pages 1-2).
// Noms des cartes : illisibles sur le scan — à remplacer depuis les cartes physiques.

export const baseActions: ActionCard[] = [

  // ── CARTES ACTION DE BASE (16 cartes) ──────────────────────────────────────
  {
    id: 'ch1-action-01',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"damage","value":1}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage","value":2}],
    },
  },
  {
    id: 'ch1-action-02',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage","value":2}],
    },
  },
  {
    id: 'ch1-action-03',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":4}],
    },
  },
  {
    id: 'ch1-action-04',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":3}],
    },
  },
  {
    id: 'ch1-action-05',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2},{"kind":"draw","value":1}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":3},{"kind":"draw","value":1}],
    },
  },
  {
    id: 'ch1-action-06',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"damage-top-deck"}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage-top-deck","bonus":2}],
    },
  },
  {
    id: 'ch1-action-07',
    kind: 'action',
    manaCost: 3,
    effects: [{"kind":"damage","value":2},{"kind":"defense","value":2}],
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":3},{"kind":"defense","value":3}],
    },
  },
  {
    id: 'ch1-action-08',
    kind: 'action',
    manaCost: 3,
    effects: [{"kind":"damage","value":2},{"kind":"damage","value":2}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":2},{"kind":"damage","value":2}],
    },
  },
  {
    id: 'ch1-action-09',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"defense","value":2}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"defense","value":2}],
    },
  },
  {
    id: 'ch1-action-10',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"defense","value":2}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"defense","value":3}],
    },
  },
  {
    id: 'ch1-action-11',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"defense","value":3}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":2},{"kind":"defense","value":2}],
    },
  },
  {
    id: 'ch1-action-12',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"defense","value":5},{"kind":"discard-random"}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"defense","value":5}],
    },
  },
  {
    id: 'ch1-action-13',
    kind: 'action',
    requiresLocations: true,
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    level2: {
      manaCost: 0,
      effects: [],
    },
  },
  {
    id: 'ch1-action-14',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"self-damage","value":1},{"kind":"mana","value":3}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"mana","value":2}],
    },
  },
  {
    id: 'ch1-action-15',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"reroll-mana"}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"reroll-mana","bonus":2}],
    },
  },
  {
    id: 'ch1-action-16',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"self-damage","value":1},{"kind":"damage","value":2}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"self-damage-x","max":3}],
    },
  },

  // ── CARTES ACTION AVANCÉES A1 (8 cartes) ──────────────────────────────────
  {
    id: 'ch1-a1-01',
    kind: 'advanced-action',
    manaCost: 3,
    effects: [{"kind":"heal","value":3}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"heal","value":2}],
    },
  },
  {
    id: 'ch1-a1-02',
    kind: 'advanced-action',
    manaCost: 1,
    effects: [{"kind":"defense","value":4}],
    level2: {
      manaCost: 1,
      effects: [{"kind":"defense","value":5}],
    },
  },
  {
    id: 'ch1-a1-03',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":4}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":5}],
    },
  },
  {
    id: 'ch1-a1-04',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":3},{"kind":"defense","value":3}],
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":4},{"kind":"defense","value":4}],
    },
  },
  {
    id: 'ch1-a1-05',
    kind: 'advanced-action',
    manaCost: 0,
    effects: [{"kind":"mana","value":2}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"mana","value":3}],
    },
  },
  {
    id: 'ch1-a1-06',
    kind: 'advanced-action',
    manaCost: 0,
    effects: [{"kind":"reroll-enemy-die","maxRerolls":1}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"reroll-enemy-die","maxRerolls":2}],
    },
  },
  {
    id: 'ch1-a1-07',
    kind: 'advanced-action',
    manaCost: 1,
    effects: [{"kind":"cancel-enemy-keyword"}],
    level2: {
      manaCost: 2,
      effects: [{"kind":"remove-from-combat"}],
    },
  },
  {
    id: 'ch1-a1-08',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2},{"kind":"defense","value":2},{"kind":"draw","value":1}],
    level2: {
      manaCost: 0,
      effects: [{"kind":"damage","value":2},{"kind":"defense","value":2},{"kind":"draw","value":1}],
    },
  },
];
