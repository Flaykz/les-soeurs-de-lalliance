export type CardKind = 'action' | 'advanced-action' | 'enemy' | 'location' | 'tower' | 'boss' | 'trap' | 'treasure';

export type BaseCard = {
  id: string;
  name: string;
  kind: CardKind;
  text: string;
};

export type ActionEffect =
  | { kind: 'damage'; value: number }
  | { kind: 'damage-top-deck' }
  | { kind: 'defense'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'draw'; value: number }
  | { kind: 'mana'; value: number }
  | { kind: 'reroll-mana' }
  | { kind: 'self-damage'; value: number }
  | { kind: 'discard-random' };

export type CardFaceData = {
  manaCost: number | null;
  effects: ActionEffect[];
  text: string;
  traits?: string[];
};

export type ActionCard = Omit<BaseCard, 'name'> & {
  kind: 'action' | 'advanced-action';
  manaCost: number | null;
  effects: ActionEffect[];
  traits?: string[];
  notes?: string;
  level2?: CardFaceData;
};

export type BossCard = BaseCard & {
  kind: 'boss';
  attack: number | null;
  healthDice: [number | '?', number | '?', number | '?', number | '?', number | '?', number | '?'];
  keyword?: string;
  normalTowerCount: number | null;
  bossTowerId: string | null;
  healthGaugeRepeats?: 1 | 2;
  traits?: string[];
  notes?: string;
};

export type EnemyCard = Omit<BaseCard, 'name'> & {
  kind: 'enemy';
  attack: number | '?' | null;
  health: number | '?' | null;
  xpReward: number | null;
  xpByRound?: number[];
  traits?: string[];
  notes?: string;
};

export type TowerCellKind = 'empty' | 'enemy' | 'trap' | 'trap-advanced' | 'treasure' | 'treasure-advanced' | 'boss';

export type TowerCell = {
  id: string;
  label: string;
  kind: TowerCellKind;
  row: number;
  col: number;
  enemyCount?: number;
};

export type TowerDefinition = {
  id: string;
  name: string;
  rows: number;
  columns: number;
  startingCellId: string;
  cells: TowerCell[];
  toursBeforeBoss?: number;
};

export type GamePhase = 'idle' | 'movement-roll' | 'choose-movement' | 'choose-destination' | 'choose-path' | 'game-over' | 'victory';

export type CombatEnemy = {
  instanceId: string;
  enemyId: string;
  enemyHealth: number;
  resolvedAttack: number;
  coriaceRevived?: boolean;
};

export type CombatPhase = 'roll-mana' | 'player' | 'enemy' | 'haste';

export type ActiveCombat = {
  enemies: CombatEnemy[];
  round: number;
  defense: number;
  phase: CombatPhase;
  pendingHits: number[];
  hasteAttackedRound1?: boolean;
};

export type CombatFeedback = {
  targetInstanceId: string;
  damage: number;
  defeated: boolean;
  xpGained: number;
  combatEnded: boolean;
};

export type PlayerFeedback = {
  incomingDamage: number;
  blocked: number;
  net: number;
};

export type PendingCombatGroup = {
  enemyIds: string[];
};

export type PendingCellRoll = {
  kind: 'trap' | 'trap-advanced' | 'treasure' | 'treasure-advanced';
  cellId: string;
};

export type TrapFeedback = {
  dieResult: number;
  trapLevel?: number;
  defenseRoll?: number;
  manaBonus?: number;
  damage: number;
  cardsDiscarded?: number;
  consequence: 'level-trap' | 'direct-damage' | 'discard-hand' | 'discard-deck' | 'discard-hand-advanced' | 'discard-hand-all' | 'no-effect';
};

export type PendingTrapLevelDiscard = {
  level: number;
  dieResult: number;
  cellLabel: string;
  manaBonus: number;
  discardedForBonus: string[];
};

export type PendingTreasureChoice = {
  source: 'deck' | 'discard';
  candidates: string[];
  dieResult: number;
  cellLabel: string;
  remaining: number;
  shuffleAfterChoice?: boolean;
};

export type TreasureFeedback = {
  dieResult: number;
  consequence: 'card-from-deck' | 'card-from-discard' | 'xp' | 'potion' | 'no-effect';
  xpGained?: number;
  cardId?: string;
  cardsRecovered?: number;
  potionsGained?: number;
};

export type MovementPath = {
  steps: number;
  cellIds: string[];
};

export type GameState = {
  bossId: string;
  health: number;
  healthLimit: number;
  xp: number;
  mana: number | null;
  potions: number;
  currentFloor: number;
  towerId: string;
  towerIds: string[];
  currentTowerIndex: number;
  towerSequenceCount: number;
  position: string;
  phase: GamePhase;
  movementDice: [number, number] | null;
  selectedMovement: number | null;
  pendingMovementPaths: MovementPath[];
  selectedMovementPathIndex: number | null;
  pendingTraps: string[];
  pendingCellRoll: PendingCellRoll | null;
  pendingTrapLevelDiscard: PendingTrapLevelDiscard | null;
  pendingTreasureChoice: PendingTreasureChoice | null;
  pendingCombatGroups: PendingCombatGroup[];
  pendingTreasures: string[];
  pendingBossCellId: string | null;
  deck: string[];
  advancedDecks: [string[], string[]];
  hand: string[];
  discard: string[];
  resolvedCells: string[];
  activeCombat: ActiveCombat | null;
  combatFeedback: CombatFeedback | null;
  playerFeedback: PlayerFeedback | null;
  trapFeedback: TrapFeedback | null;
  treasureFeedback: TreasureFeedback | null;
  flippedCards: string[];
  banishableCardId: string | null;
  pendingHasteAttack: number | null;
  log: string[];
};
