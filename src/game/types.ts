export type CardKind = 'action' | 'advanced-action' | 'enemy' | 'location' | 'tower' | 'boss' | 'trap' | 'treasure';

export type BaseCard = {
  id: string;
  name: string;
  kind: CardKind;
  text: string;
};

export type ActionEffect =
  | { kind: 'damage'; value: number }
  | { kind: 'damage-top-deck'; bonus?: number }
  | { kind: 'defense'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'draw'; value: number }
  | { kind: 'mana'; value: number }
  | { kind: 'reroll-mana'; bonus?: number }
  | { kind: 'self-damage'; value: number }
  | { kind: 'discard-random' }
  | { kind: 'reroll-enemy-die'; maxRerolls: number }
  | { kind: 'cancel-enemy-keyword' }
  | { kind: 'remove-from-combat' }
  | { kind: 'self-damage-x'; max: number };

export type CardFaceData = {
  manaCost: number | null;
  effects: ActionEffect[];
  text?: string;
  traits?: string[];
};

export type ActionCard = Omit<BaseCard, 'name' | 'text'> & {
  text?: string;
  kind: 'action' | 'advanced-action';
  manaCost: number | null;
  effects: ActionEffect[];
  traits?: string[];
  level2?: CardFaceData;
  requiresLocations?: true;
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

export type BossCombatPhase = 'roll-mana' | 'player' | 'boss-attack';

export type ActiveBossCombat = {
  round: number;
  phase: BossCombatPhase;
  healthDice: (number | null)[];
  gaugeIndex: number;
  defense: number;
};

export type BossCombatFeedback = {
  dieIndex: number;
  damage: number;
  dieRemoved: boolean;
  gaugeCleared: boolean;
};

export type CombatEnemy = {
  instanceId: string;
  enemyId: string;
  enemyHealth: number;
  resolvedAttack: number;
  coriaceRevived?: boolean;
  attackWasRolled?: boolean;
  healthWasRolled?: boolean;
  suppressedTraits?: string[];
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
  coriaceReviving?: boolean;
  coriaceJustRevived?: boolean;
  coriaceRevivedAttack?: number;
};

export type PlayerFeedback = {
  incomingDamage: number;
  blocked: number;
  net: number;
  hits: Array<{ instanceId: string; damage: number }>;
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
  discardedCardId?: string;
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
  activeBossCombat: ActiveBossCombat | null;
  bossCombatFeedback: BossCombatFeedback | null;
  playerFeedback: PlayerFeedback | null;
  trapFeedback: TrapFeedback | null;
  treasureFeedback: TreasureFeedback | null;
  blockedMovementFeedback: { dice: [number, number] } | null;
  flippedCards: string[];
  banishableCardId: string | null;
  pendingHasteAttack: number | null;
  manaJustRolled: boolean;
  useLocations: boolean;
  pendingEnemyReroll: { remainingRerolls: number } | null;
  pendingKeywordCancel: boolean;
  pendingRemoveFromCombat: boolean;
  pendingSelfDamageX: { max: number; targetInstanceId: string } | null;
  log: string[];
};
