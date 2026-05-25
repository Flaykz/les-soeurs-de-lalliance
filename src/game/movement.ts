import type { GameState, MovementPath, TowerCell } from './types';
import { getCell, getCurrentTower } from './data-access';
import { resolveCrossedCells } from './cells';
import { addLog, rollDie } from './utils';

export function rollMovementDice(state: GameState): GameState {
  if (state.phase === 'game-over' || state.phase === 'victory' || state.activeCombat || state.pendingCellRoll) {
    return state;
  }

  const movementDice: [number, number] = [rollDie(), rollDie()];
  const nextState: GameState = {
    ...state,
    mana: null,
    movementDice,
    selectedMovement: null,
    pendingMovementPaths: [],
    selectedMovementPathIndex: null,
    blockedMovementFeedback: null,
    phase: 'choose-destination'
  };

  if (getMovementOptions(nextState).length === 0) {
    const blockedState = addLog(
      { ...nextState, movementDice: null, pendingMovementPaths: [], selectedMovementPathIndex: null, blockedMovementFeedback: { dice: movementDice } },
      `Des de deplacement : ${movementDice[0]} et ${movementDice[1]}. Aucune destination possible, deplacement ignore (regle : arret immediat).`
    );
    return resolveCrossedCells(blockedState, []);
  }

  return addLog(nextState, `Des de deplacement : ${movementDice[0]} et ${movementDice[1]}. Choisis une destination atteignable.`);
}

export function chooseMovementDie(state: GameState, dieIndex: 0 | 1): GameState {
  if (!state.movementDice || state.phase !== 'choose-movement') {
    return state;
  }

  const steps = state.movementDice[dieIndex];
  const destinations = getMovementOptions(state, steps);

  if (destinations.length === 0) {
    return addLog(
      {
        ...state,
        movementDice: null,
        selectedMovement: null,
        pendingMovementPaths: [],
        selectedMovementPathIndex: null,
        phase: 'movement-roll'
      },
      `Aucune destination exacte possible avec ${steps}. Relance les des.`
    );
  }

  return addLog(
    {
      ...state,
      selectedMovement: steps,
      phase: 'choose-destination'
    },
    `De ${steps} choisi : selectionne une destination atteignable.`
  );
}

export function chooseMovementDestination(state: GameState, cellId: string): GameState {
  if (state.phase !== 'choose-destination') {
    return state;
  }

  const movements = getMovementChoices(state, cellId);
  const destination = getCell(state, cellId);
  if (movements.length === 0 || !destination) {
    return addLog(state, 'Destination invalide ou deja visitee pour ce deplacement.');
  }

  if (movements.length > 1) {
    return addLog(
      {
        ...state,
        pendingMovementPaths: movements,
        selectedMovementPathIndex: 0,
        phase: 'choose-path'
      },
      `${movements.length} chemins possibles vers ${destination.label}. Choisis le chemin a emprunter.`
    );
  }

  return resolveMovementPath(state, movements[0]);
}

export function chooseMovementPath(state: GameState, pathIndex: number): GameState {
  if (state.phase !== 'choose-path') {
    return state;
  }

  if (!state.pendingMovementPaths[pathIndex]) {
    return addLog(state, 'Chemin invalide.');
  }

  return { ...state, selectedMovementPathIndex: pathIndex };
}

export function cancelMovementPath(state: GameState): GameState {
  if (state.phase !== 'choose-path') {
    return state;
  }
  return { ...state, pendingMovementPaths: [], selectedMovementPathIndex: null, phase: 'choose-destination' };
}

export function confirmMovementPath(state: GameState): GameState {
  if (state.phase !== 'choose-path' || state.selectedMovementPathIndex === null) {
    return state;
  }

  const movement = state.pendingMovementPaths[state.selectedMovementPathIndex];
  if (!movement) {
    return addLog(state, 'Chemin invalide.');
  }

  return resolveMovementPath(state, movement);
}

export function describeMovementPath(state: GameState, movement: MovementPath): string {
  const cells = movement.cellIds.slice(1).map((cellId) => getCell(state, cellId)).filter((cell): cell is TowerCell => Boolean(cell));
  const trapCount = cells.filter((cell) => cell.kind === 'trap').length;
  const enemyCount = cells.reduce((total, cell) => total + (cell.kind === 'enemy' ? cell.enemyCount ?? 1 : 0), 0);
  const treasureCount = cells.filter((cell) => cell.kind === 'treasure').length;
  const bossCount = cells.filter((cell) => cell.kind === 'boss').length;

  return [
    `☠ ${trapCount}`,
    `⚔ ${enemyCount}`,
    `▣ ${treasureCount}`,
    bossCount > 0 ? `♛ ${bossCount}` : null
  ].filter(Boolean).join(', ');
}

export function getMovementOptions(state: GameState, steps = state.selectedMovement ?? 0): TowerCell[] {
  const movementValues = steps > 0 ? [steps] : getCandidateMovementValues(state);
  if (movementValues.length === 0) {
    return [];
  }

  const destinations = new Map<string, TowerCell>();
  for (const movementValue of movementValues) {
    for (const path of getMovementPaths(state, state.position, movementValue)) {
      const destination = getCell(state, path[path.length - 1]);
      if (destination && destination.id !== state.position && !state.resolvedCells.includes(destination.id)) {
        destinations.set(destination.id, destination);
      }
    }
  }

  return Array.from(destinations.values()).sort((a, b) => a.row - b.row || a.col - b.col);
}

function resolveMovementPath(state: GameState, movement: MovementPath): GameState {
  const destinationId = movement.cellIds[movement.cellIds.length - 1];
  const destination = getCell(state, destinationId);
  if (!destination) {
    return state;
  }

  const crossedCells = movement.cellIds.slice(1).map((id) => getCell(state, id)).filter((cell): cell is TowerCell => Boolean(cell));
  const nextState = addLog(
    {
      ...state,
      position: destinationId,
      movementDice: null,
      selectedMovement: null,
      pendingMovementPaths: [],
      selectedMovementPathIndex: null,
      phase: 'movement-roll'
    },
    `De ${movement.steps} deduit : deplacement vers ${destination.label}. Cases traversees : ${crossedCells.map((cell) => cell.label).join(', ')}.`
  );

  return resolveCrossedCells(nextState, crossedCells);
}

export function getMovementChoices(state: GameState, destinationCellId: string): MovementPath[] {
  const movements: MovementPath[] = [];
  for (const steps of getCandidateMovementValues(state)) {
    for (const path of getMovementPaths(state, state.position, steps)) {
      if (path[path.length - 1] === destinationCellId) {
        movements.push({ steps, cellIds: path });
      }
    }
  }

  return movements;
}

function getCandidateMovementValues(state: GameState): number[] {
  if (state.selectedMovement) {
    return [state.selectedMovement];
  }

  return Array.from(new Set(state.movementDice ?? []));
}

function getMovementPaths(state: GameState, startCellId: string, steps: number): string[][] {
  const start = getCell(state, startCellId);
  if (!start) {
    return [];
  }

  const paths: string[][] = [];
  const walk = (cell: TowerCell, remainingSteps: number, path: string[]) => {
    if (remainingSteps === 0) {
      paths.push(path);
      return;
    }

    for (const nextCell of getAllowedNeighbors(state, cell)) {
      if (path.includes(nextCell.id) || state.resolvedCells.includes(nextCell.id)) {
        continue;
      }

      const extendedPath = [...path, nextCell.id];
      if (nextCell.kind === 'boss') {
        paths.push(extendedPath);
        continue;
      }

      walk(nextCell, remainingSteps - 1, extendedPath);
    }
  };

  walk(start, steps, [start.id]);
  return paths;
}

function getAllowedNeighbors(state: GameState, cell: TowerCell): TowerCell[] {
  return getCurrentTower(state).cells.filter((candidate) => {
    const horizontalStep = candidate.row === cell.row && Math.abs(candidate.col - cell.col) === 1;
    const upwardStep = candidate.col === cell.col && candidate.row === cell.row - 1;
    return horizontalStep || upwardStep;
  });
}
