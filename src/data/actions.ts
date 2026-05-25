import type { ActionCard } from '../game/types';

// Coûts Mana et effets principaux issus du PDF (Chapitre 1, pages 1-2).
// Noms des cartes : illisibles sur le scan — à remplacer depuis les cartes physiques.
// Effets marqués null ou avec notes?: 'TODO' = valeur non confirmée.

export const baseActions: ActionCard[] = [

  // ── CARTES ACTION DE BASE (16 cartes) ──────────────────────────────────────
  {
    id: 'ch1-action-01',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"damage","value":1}],
    text: "Infligez 1 dégât.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage","value":2}],
      text: "Infligez 2 dégâts.",
    },
  },
  {
    id: 'ch1-action-02',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    text: "Infligez 2 dégâts.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage","value":2}],
      text: "Infligez 2 dégâts.",
    },
  },
  {
    id: 'ch1-action-03',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    text: "Infligez 2 dégâts.",
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":4}],
      text: "Infligez 4 dégâts.",
    },
  },
  {
    id: 'ch1-action-04',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    text: "Infligez 2 dégâts.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":3}],
      text: "Infligez 3 dégâts.",
    },
  },
  {
    id: 'ch1-action-05',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2},{"kind":"draw","value":1}],
    text: "Infligez 2 dégâts. Piochez 1 carte.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":3},{"kind":"draw","value":1}],
      text: "Infligez 3 dégâts. Piochez 1 carte.",
    },
  },
  {
    id: 'ch1-action-06',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"damage-top-deck"}],
    text: "Infligez X dégâts. X = le coût en Mana de la prochaine carte du deck Action.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"damage-top-deck"}],
      text: "",
    },
  },
  {
    id: 'ch1-action-07',
    kind: 'action',
    manaCost: 3,
    effects: [{"kind":"damage","value":2},{"kind":"defense","value":2}],
    text: "Infligez 2 dégâts. Gagnez 2 Défenses.",
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":3},{"kind":"defense","value":3}],
      text: "Infligez 3 dégâts. Gagnez 3 Défenses.",
    },
  },
  {
    id: 'ch1-action-08',
    kind: 'action',
    manaCost: 3,
    effects: [{"kind":"damage","value":2},{"kind":"damage","value":2}],
    text: "Infligez 2x2 dégâts.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":2}],
      text: "Infligez 2x2 dégâts.",
    },
  },
  {
    id: 'ch1-action-09',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"defense","value":2}],
    text: "Gagnez 2 Défenses.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"defense","value":2}],
      text: "Gagnez 2 Défenses.",
    },
  },
  {
    id: 'ch1-action-10',
    kind: 'action',
    manaCost: 1,
    effects: [{"kind":"defense","value":2}],
    text: "Gagnez 2 Défenses.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"defense","value":3}],
      text: "Gagnez 3 Défenses.",
    },
  },
  {
    id: 'ch1-action-11',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"defense","value":3}],
    text: "Gagnez 3 Défenses.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":2},{"kind":"defense","value":2}],
      text: "Infliez 2 dégâts. Gagnez 2 Déenses.",
    },
  },
  {
    id: 'ch1-action-12',
    kind: 'action',
    manaCost: 2,
    effects: [{"kind":"defense","value":5},{"kind":"discard-random"}],
    text: "Gagnez 5 Défenses. Défaussez une carte au hasard de votre main.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"defense","value":5}],
      text: "Gagnez 5 Défenses.",
    },
  },
  {
    id: 'ch1-action-13',
    kind: 'action',
    requiresLocations: true,
    manaCost: 2,
    effects: [{"kind":"damage","value":2}],
    text: "Changez de lieu. Condition : à effectuer au début du combat. -- Infligez 2 dégâts.",
    level2: {
      manaCost: 0,
      effects: [],
      text: "Changez de lieu.",
    },
  },
  {
    id: 'ch1-action-14',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"self-damage","value":1},{"kind":"mana","value":3}],
    text: "Subissez 1 dégât. Gagnez 3 Mana.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"mana","value":2}],
      text: "Gagnez 2 Mana.",
    },
  },
  {
    id: 'ch1-action-15',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"reroll-mana"}],
    text: "Relancez le dé de Mana. Condition : à effectuer au début du tour.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"reroll-mana"}],
      text: "",
    },
  },
  {
    id: 'ch1-action-16',
    kind: 'action',
    manaCost: 0,
    effects: [{"kind":"self-damage","value":1},{"kind":"damage","value":2}],
    text: "Subissez 1 dégât. Infligez 2 dégâts.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"damage","value":3},{"kind":"draw","value":1}],
      text: "",
    },
  },

  // ── CARTES ACTION AVANCÉES A1 (8 cartes) ──────────────────────────────────
  {
    id: 'ch1-a1-01',
    kind: 'advanced-action',
    manaCost: 3,
    effects: [{"kind":"heal","value":3}],
    text: "Gagnez 3 points de Santé.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"heal","value":2}],
      text: "Gagnez 2 points de Santé.",
    },
  },
  {
    id: 'ch1-a1-02',
    kind: 'advanced-action',
    manaCost: 1,
    effects: [{"kind":"defense","value":4}],
    text: "Gagnez 4 Défenses.",
    level2: {
      manaCost: 1,
      effects: [{"kind":"defense","value":5}],
      text: "Gagnez 5 Défenses",
    },
  },
  {
    id: 'ch1-a1-03',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":4}],
    text: "Infligez 4 dégâts.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"damage","value":5}],
      text: "Infligez 5 dégâts",
    },
  },
  {
    id: 'ch1-a1-04',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":3},{"kind":"defense","value":3}],
    text: "Infligez 3 dégâts. Gagnez 3 Défenses.",
    level2: {
      manaCost: 3,
      effects: [{"kind":"damage","value":4},{"kind":"defense","value":4}],
      text: "Infligez 4 dégâts. Gagnez 4 Défenses.",
    },
  },
  {
    id: 'ch1-a1-05',
    kind: 'advanced-action',
    manaCost: 0,
    effects: [{"kind":"mana","value":2}],
    text: "Gagnez 2 Mana.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"mana","value":3}],
      text: "Gagnez 3 Mana.",
    },
  },
  {
    id: 'ch1-a1-06',
    kind: 'advanced-action',
    manaCost: 0,
    effects: [{"kind":"reroll-enemy-die","maxRerolls":1},{"kind":"draw","value":1}],
    text: "Après un lancer, relancez 1 fois un dé Resistance ou Attaque d'un ennemi. -- Piochez 1 carte.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"reroll-enemy-die","maxRerolls":2}],
      text: "Après un lancer, relancez jusqu'à 2 fois un dé Resistance ou Attaque d'un ennemi.",
    },
  },
  {
    id: 'ch1-a1-07',
    kind: 'advanced-action',
    manaCost: 1,
    effects: [{"kind":"cancel-enemy-keyword"},{"kind":"damage","value":3}],
    text: "Annulez un mot-clé d'un ennemi en jeu. -- Infligez 3 dégâts.",
    level2: {
      manaCost: 2,
      effects: [{"kind":"remove-from-combat"}],
      text: "Retirez du combat un ennemi ayant un mot-clé, puis défaussez-le.",
    },
  },
  {
    id: 'ch1-a1-08',
    kind: 'advanced-action',
    manaCost: 2,
    effects: [{"kind":"damage","value":2},{"kind":"defense","value":2},{"kind":"draw","value":1}],
    text: "Infligez 3 dégâts. Gagnez 2 Défenses. Piochez 1 carte.",
    level2: {
      manaCost: 0,
      effects: [{"kind":"damage","value":2},{"kind":"defense","value":2},{"kind":"draw","value":1}],
      text: "Infligez 2 dégâts. Gagnez 2 Défenses. Piochez une carte.",
    },
  },
];
