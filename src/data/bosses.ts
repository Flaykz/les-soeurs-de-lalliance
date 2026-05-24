import type { BossCard } from '../game/types';

// Saisie conseillee : une entree par boss de la boite de base.
// `healthDice` represente la jauge de sante de 6 des du boss.
// Une valeur `?` signifie que le de est tire au hasard au debut du combat boss.
// `healthGaugeRepeats: 2` represente l'icone x2 : vaincre deux jauges completes.
export const baseBosses: BossCard[] = [
  {
    id: 'boss-herion',
    name: 'Herion',
    kind: 'boss',
    attack: 4,
    keyword: 'Rage',
    normalTowerCount: 2,
    bossTowerId: 'boss-tower-herion',
    healthGaugeRepeats: 1,
    healthDice: [6, 4, 4, 3, 3, 2],
    text: 'Herion'
  },
  {
    id: 'boss-kraam',
    name: 'Kraam',
    kind: 'boss',
    attack: 6,
    keyword: 'Brûlures',
    normalTowerCount: 4,
    bossTowerId: 'boss-tower-kraam',
    healthGaugeRepeats: 2,
    healthDice: ['?', '?', '?', '?', '?', '?'],
    text: 'Kraam'
  },
  {
    id: 'boss-nemeth',
    name: 'Németh',
    kind: 'boss',
    attack: 5,
    keyword: 'Force Brutale',
    normalTowerCount: 3,
    bossTowerId: 'boss-tower-nemeth',
    healthGaugeRepeats: 2,
    healthDice: [6, 5, 4, 3, 2, 1],
    text: 'Németh'
  },
  {
    id: 'boss-radiaw',
    name: 'Radiaw',
    kind: 'boss',
    attack: 5,
    keyword: 'Gardiens',
    normalTowerCount: 2,
    bossTowerId: 'boss-tower-radiaw',
    healthGaugeRepeats: 1,
    healthDice: [5, 5, 5, '?', '?', '?'],
    text: 'Radiaw'
  },
];
