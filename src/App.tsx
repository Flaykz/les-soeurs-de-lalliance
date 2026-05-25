import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { PWAPrompts } from './components/PWAPrompts';
import { BossSelection } from './components/BossSelection';
import { DieFace, RollingDie } from './components/DieFace';
import { CardPeek, DiscardList } from './components/CardCatalog';
import { BossCombatZone } from './components/BossCombatZone';
import { CombatZone } from './components/CombatZone';
import { HandDock } from './components/HandDock';
import { CardInspectOverlay } from './components/overlays/CardInspectOverlay';
import { DecksOverlay } from './components/overlays/DecksOverlay';
import { LogOverlay } from './components/overlays/LogOverlay';
import { TowerStackOverlay } from './components/overlays/TowerStackOverlay';
import { TowerGrid } from './components/TowerGrid';
import { TrapReferenceCard } from './components/TrapReferenceCard';
import { TreasureReferenceCard } from './components/TreasureReferenceCard';
import {
  applyNextPendingHit,
  banishPlayedCardWithXp,
  buyAdvancedActionCard,
  buyPotionWithXp,
  buyTopActionCard,
  cycleAdvancedDeckCard,
  canBanishPlayedCard,
  chooseMovementDestination,
  isCombatTargetUntargetable,
  resolveHasteAttack,
  cancelMovementPath,
  chooseMovementPath,
  clearPlayerFeedback,
  chooseTreasureCard,
  clearTrapFeedback,
  clearTreasureFeedback,
  completeBossCombatFeedback,
  completeCombatFeedback,
  confirmMovementPath,
  endBossPlayerPhase,
  playBossActionCard,
  resolveBossAttack,
  rollBossMana,
  describeMovementPath,
  discardCardForTrapBonus,
  undoTrapDiscard,
  discardHandCardForMana,
  resolveTrapLevelWithBonus,
  endCombatRound,
  endPlayerPhase,
  cardNeedsTarget,
  getAction,
  resolveCardForDisplay,
  getBoss,
  getCell,
  getCurrentCell,
  getCurrentTower,
  getEnemy,
  getMovementChoices,
  getMovementOptions,
  playActionCard,
  refillActionDeckIfEmpty,
  rerollManaWithXp,
  rerollMovementDiceWithXp,
  rollMana,
  rollMovementDice,
  rollPendingCellResolution,
  upgradeCard,
  canUpgradeCard,
  usePotion
} from './game/rules';
import type { ActionCard, GameState } from './game/types';
import { animationDurations, defaultAnimationSpeed, isAnimationSpeed, type AnimationSpeed } from './ui/animationConfig';
import {
  STORAGE_KEY,
  describeTrapConsequence,
  describeTrapConsequenceTitle,
  describeTreasureConsequence,
  getBuyActionDisabledReason,
  getDiscardForManaDisabledReason,
  loadSavedGame
} from './ui/appHelpers';

function scrollToBottom(el: HTMLElement) {
  requestAnimationFrame(() => {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  });
}

const ANIMATION_SPEED_KEY = 'lsa-animation-speed';

export function App() {
  const [game, setGame] = useState<GameState | null>(() => loadSavedGame());
  const [showLog, setShowLog] = useState(false);
  const [showTowerStack, setShowTowerStack] = useState(false);
  const [showDecks, setShowDecks] = useState(false);
  const [selectedEnemyInstanceId, setSelectedEnemyInstanceId] = useState<string | null>(null);
  const [selectedBossDieIndex, setSelectedBossDieIndex] = useState<number | null>(null);
  const [inspectedHandIndex, setInspectedHandIndex] = useState<number | null>(null);
  const [combatMessage, setCombatMessage] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<ActionCard | null>(null);
  const [movementAnim, setMovementAnim] = useState<{ pathCellIds: string[]; step: number; pendingGame: GameState } | null>(null);
  const [showTrapIntro, setShowTrapIntro] = useState(false);
  const [showTrapLevelIntro, setShowTrapLevelIntro] = useState(false);
  const [rollingCellDie, setRollingCellDie] = useState(false);
  const [trapDiscardAnimCardId, setTrapDiscardAnimCardId] = useState<string | null>(null);
  const prevHealthRef = useRef<number | null>(null);
  const prevXpRef = useRef<number | null>(null);
  // Initialiser depuis le game state sauvegardé pour éviter de faux déclenchements d'animation au refresh
  const prevPendingCellRollRef = useRef<GameState['pendingCellRoll'] | null>(game?.pendingCellRoll ?? null);
  const prevTrapFeedbackRef = useRef<GameState['trapFeedback']>(game?.trapFeedback ?? null);
  const prevPendingTrapLevelDiscardRef = useRef<GameState['pendingTrapLevelDiscard']>(game?.pendingTrapLevelDiscard ?? null);
  const shellRef = useRef<HTMLElement>(null);
  const prevPhaseKeyRef = useRef('');
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(() => {
    const savedSpeed = localStorage.getItem(ANIMATION_SPEED_KEY);
    return isAnimationSpeed(savedSpeed) ? savedSpeed : defaultAnimationSpeed;
  });

  useEffect(() => {
    if (game) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [game]);

  useEffect(() => {
    if (!game || game.deck.length > 0 || game.discard.length === 0) return;
    setGame(refillActionDeckIfEmpty(game));
  }, [game]);

  useEffect(() => {
    const el = shellRef.current;
    if (!game || !el) return;
    const combatPhase = game.activeCombat?.phase ?? game.activeBossCombat?.phase ?? '';
    const key = `${game.phase}|${combatPhase}`;
    if (key === prevPhaseKeyRef.current) return;
    prevPhaseKeyRef.current = key;
    if (game.phase === 'movement-roll' || combatPhase === 'roll-mana') {
      scrollToBottom(el);
    }
  }, [game]);

  useEffect(() => {
    localStorage.setItem(ANIMATION_SPEED_KEY, animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    if (!game?.activeCombat) {
      setSelectedEnemyInstanceId(null);
      setCombatMessage(null);
      return;
    }

    const livingEnemies = game.activeCombat.enemies.filter((e) => e.enemyHealth > 0);

    if (livingEnemies.length === 1) {
      setSelectedEnemyInstanceId(livingEnemies[0].instanceId);
      return;
    }

    if (!game.activeCombat.enemies.some((enemy) => enemy.instanceId === selectedEnemyInstanceId)) {
      setSelectedEnemyInstanceId(null);
    }
  }, [game?.activeCombat, selectedEnemyInstanceId]);

  useEffect(() => {
    if (!game?.combatFeedback) return;
    const durations = animationDurations[animationSpeed];
    const timeout = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.combatFeedback ? completeCombatFeedback(currentGame) : currentGame);
    }, game.combatFeedback.combatEnded ? durations.combatEnd : game.combatFeedback.defeated ? durations.defeat : durations.damage);
    return () => window.clearTimeout(timeout);
  }, [animationSpeed, game?.combatFeedback]);

  useEffect(() => {
    if (!game?.bossCombatFeedback) return;
    const durations = animationDurations[animationSpeed];
    const timeout = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.bossCombatFeedback ? completeBossCombatFeedback(currentGame) : currentGame);
    }, game.bossCombatFeedback.dieRemoved ? durations.defeat : durations.damage);
    return () => window.clearTimeout(timeout);
  }, [animationSpeed, game?.bossCombatFeedback]);

  useEffect(() => {
    if (!game?.playerFeedback) return;
    const durations = animationDurations[animationSpeed];
    const timeout = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.playerFeedback ? clearPlayerFeedback(currentGame) : currentGame);
    }, durations.playerFeedback);
    return () => window.clearTimeout(timeout);
  }, [animationSpeed, game?.playerFeedback]);


  useEffect(() => {
    const prev = prevTrapFeedbackRef.current;
    const current = game?.trapFeedback ?? null;
    prevTrapFeedbackRef.current = current;
    if (!prev && current?.consequence === 'discard-hand' && current.discardedCardId) {
      setTrapDiscardAnimCardId(current.discardedCardId);
    }
    if (prev && !current) {
      setTrapDiscardAnimCardId(null);
    }
  }, [game?.trapFeedback]);

  const prevShowTrapIntroRef = useRef(false);
  useEffect(() => {
    const prev = prevShowTrapIntroRef.current;
    prevShowTrapIntroRef.current = showTrapIntro;
    if (prev && !showTrapIntro && shellRef.current) {
      scrollToBottom(shellRef.current);
    }
  }, [showTrapIntro]);

  const prevShowTrapLevelIntroRef = useRef(false);
  useEffect(() => {
    const prev = prevShowTrapLevelIntroRef.current;
    prevShowTrapLevelIntroRef.current = showTrapLevelIntro;
    if (prev && !showTrapLevelIntro && shellRef.current) {
      scrollToBottom(shellRef.current);
    }
  }, [showTrapLevelIntro]);

  useEffect(() => {
    if (!game?.treasureFeedback) return;
    const duration = animationDurations[animationSpeed].trapFeedback;
    const timer = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.treasureFeedback ? clearTreasureFeedback(currentGame) : currentGame);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [animationSpeed, game?.treasureFeedback]);

  useEffect(() => {
    if (!movementAnim) return;
    const stepMs = animationDurations[animationSpeed].movementStep;
    const timer = window.setTimeout(() => {
      if (movementAnim.step >= movementAnim.pathCellIds.length - 1) {
        setGame(movementAnim.pendingGame);
        setMovementAnim(null);
      } else {
        setMovementAnim((prev) => prev ? { ...prev, step: prev.step + 1 } : null);
      }
    }, stepMs);
    return () => window.clearTimeout(timer);
  }, [animationSpeed, movementAnim]);

  useEffect(() => {
    if (!game) return;
    const prev = prevPendingCellRollRef.current;
    const current = game.pendingCellRoll;
    prevPendingCellRollRef.current = current;
    if (prev?.kind !== 'trap' && current?.kind === 'trap') {
      const introMs = animationDurations[animationSpeed].trapIntro;
      setShowTrapIntro(true);
      const timer = window.setTimeout(() => setShowTrapIntro(false), introMs);
      return () => window.clearTimeout(timer);
    }
  }, [animationSpeed, game?.pendingCellRoll]);

  useEffect(() => {
    if (!game) return;
    const prev = prevPendingTrapLevelDiscardRef.current;
    const current = game.pendingTrapLevelDiscard;
    prevPendingTrapLevelDiscardRef.current = current;
    if (!prev && current) {
      const SCAN_MS = 2000;
      setShowTrapLevelIntro(true);
      const timer = window.setTimeout(() => setShowTrapLevelIntro(false), SCAN_MS);
      return () => window.clearTimeout(timer);
    }
  }, [game?.pendingTrapLevelDiscard]);

  useLayoutEffect(() => {
    if (!game) return;
    prevHealthRef.current = game.health;
    prevXpRef.current = game.xp;
  });


  if (!game) {
    return (
      <>
        <PWAPrompts />
        <BossSelection
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
          onStartGame={(state) => {
            setGame(state);
            requestAnimationFrame(() => {
              document.querySelector('.game-shell')?.scrollTo({ top: 0, behavior: 'instant' });
            });
          }}
        />
      </>
    );
  }

  const currentCell = getCurrentCell(game);
  const currentTower = getCurrentTower(game);
  const selectedBoss = getBoss(game.bossId);
  const towerProgress = `${game.currentTowerIndex + 1}/${game.towerIds.length}`;
  const activeEnemies = game.activeCombat
    ? game.activeCombat.enemies.map((enemy) => ({
        ...enemy,
        card: getEnemy(enemy.enemyId),
        isUntargetable: isCombatTargetUntargetable(game.activeCombat!, enemy.instanceId)
      }))
    : [];
  const selectedEnemy = activeEnemies.find((enemy) => enemy.instanceId === selectedEnemyInstanceId);
  const movementOptions = game.phase === 'choose-destination' ? getMovementOptions(game) : [];
  const selectedPath = game.selectedMovementPathIndex === null ? null : game.pendingMovementPaths[game.selectedMovementPathIndex];
  const pendingCell = game.pendingCellRoll ? getCell(game, game.pendingCellRoll.cellId) : null;
  const topActionCard = game.deck[0] ? getAction(game.deck[0]) ?? null : null;
  const topAdvancedCards = game.advancedDecks.map((deck) => deck[0] ? getAction(deck[0]) ?? null : null);
  const hasPendingHit = Boolean(game.activeCombat && game.activeCombat.pendingHits.length > 0 && !game.combatFeedback);
  const canActInCombat = Boolean(game.activeCombat?.phase === 'player' && game.mana !== null && !game.combatFeedback && !hasPendingHit);
  const canActInBossCombat = Boolean(game.activeBossCombat?.phase === 'player' && game.mana !== null && !game.bossCombatFeedback);
  const unplayableCardIds = new Set(
    canActInCombat
      ? game.hand.filter((cardId) => {
          const c = getAction(cardId);
          if (!c) return false;
          const face = resolveCardForDisplay(c, game.flippedCards);
          if (face.manaCost != null && face.manaCost > (game.mana ?? 0)) return true;
          if (cardNeedsTarget(c, game.flippedCards) && !selectedEnemyInstanceId) return true;
          return false;
        })
      : []
  );
  const buyActionDisabledReason = getBuyActionDisabledReason(game);
  const canRerollMovementWithXp = game.xp >= 1 && Boolean(game.movementDice) && (game.phase === 'choose-destination' || game.phase === 'choose-path') && !game.activeCombat;
  const animationStyle = {
    '--combat-animation-ms': `${animationDurations[animationSpeed].defeat}ms`,
    '--dice-animation-ms': `${animationDurations[animationSpeed].damage}ms`,
    '--player-feedback-ms': `${animationDurations[animationSpeed].playerFeedback}ms`,
    '--move-step-ms': `${animationDurations[animationSpeed].movementStep}ms`,
    '--trap-feedback-ms': `${animationDurations[animationSpeed].trapFeedback}ms`
  } as CSSProperties;

  const healthDelta = prevHealthRef.current !== null ? game.health - prevHealthRef.current : 0;
  const xpDelta = prevXpRef.current !== null ? game.xp - prevXpRef.current : 0;

  function handleDestinationClick(cellId: string) {
    if (!game || movementAnim) return;
    const nextGame = chooseMovementDestination(game, cellId);
    if (nextGame.phase !== 'choose-path') {
      const paths = getMovementChoices(game, cellId);
      if (paths.length === 1 && paths[0].cellIds.length > 1) {
        setMovementAnim({ pathCellIds: paths[0].cellIds, step: 1, pendingGame: nextGame });
        return;
      }
    } else if (nextGame.pendingMovementPaths.length === 1) {
      const path = nextGame.pendingMovementPaths[0];
      const confirmed = confirmMovementPath(nextGame);
      if (path.cellIds.length > 1) {
        setMovementAnim({ pathCellIds: path.cellIds, step: 1, pendingGame: confirmed });
        return;
      }
      setGame(confirmed);
      return;
    }
    setGame(nextGame);
  }

  function cyclePath(dir: 1 | -1) {
    if (!game) return;
    const total = game.pendingMovementPaths.length;
    const current = game.selectedMovementPathIndex ?? 0;
    setGame(chooseMovementPath(game, (current + dir + total) % total));
  }

  function handleConfirmMovement() {
    if (!game || movementAnim) return;
    const path = game.selectedMovementPathIndex !== null
      ? game.pendingMovementPaths[game.selectedMovementPathIndex]
      : null;
    const nextGame = confirmMovementPath(game);
    if (path && path.cellIds.length > 1) {
      setMovementAnim({ pathCellIds: path.cellIds, step: 1, pendingGame: nextGame });
      return;
    }
    setGame(nextGame);
  }

  function startNewGame() {
    setSelectedEnemyInstanceId(null);
    setSelectedBossDieIndex(null);
    setInspectedHandIndex(null);
    setCombatMessage(null);
    setMovementAnim(null);
    setShowTrapIntro(false);
    setGame(null);
  }

  function chooseEnemyTarget(enemyInstanceId: string) {
    if (hasPendingHit && game) {
      const targetEnemy = activeEnemies.find((e) => e.instanceId === enemyInstanceId);
      if (targetEnemy?.isUntargetable) {
        setCombatMessage("Cet ennemi est Caché : attaquez d'abord les autres ennemis.");
        return;
      }
      setCombatMessage(null);
      setGame(applyNextPendingHit(game, enemyInstanceId));
      return;
    }

    if (!canActInCombat) {
      setCombatMessage("Lance d'abord le de de mana avant de choisir une cible.");
      return;
    }

    const targetEnemy = activeEnemies.find((e) => e.instanceId === enemyInstanceId);
    if (targetEnemy?.isUntargetable) {
      setCombatMessage("Cet ennemi est Caché : attaquez d'abord les autres ennemis.");
      return;
    }

    setSelectedEnemyInstanceId(enemyInstanceId);
    setCombatMessage(null);
  }

  function playCardFromHand(cardId: string) {
    if (!game) return;

    if (game.activeBossCombat) {
      if (game.mana === null) { setCombatMessage("Lance d'abord le dé de mana."); return; }
      setCombatMessage(null);
      setInspectedHandIndex(null);
      setGame(playBossActionCard(game, cardId, selectedBossDieIndex));
      return;
    }

    if (!game.activeCombat) return;

    const cardRaw = getAction(cardId);
    const card = cardRaw ? resolveCardForDisplay(cardRaw, game.flippedCards) : undefined;
    if (game.mana === null) {
      setCombatMessage("Lance d'abord le de de mana avant de jouer une carte.");
      return;
    }

    if (card?.manaCost !== null && card?.manaCost !== undefined && card.manaCost > game.mana) {
      setCombatMessage('Mana insuffisante pour jouer cette carte.');
      return;
    }

    const needsTarget = cardRaw ? cardNeedsTarget(cardRaw, game.flippedCards) : false;
    if (needsTarget && !selectedEnemyInstanceId) {
      setCombatMessage("Selectionne d'abord un ennemi avant de jouer une carte.");
      return;
    }

    setCombatMessage(null);
    setInspectedHandIndex(null);
    setGame(playActionCard(game, cardId, needsTarget ? selectedEnemyInstanceId : null));
  }

  function buyActionCard() {
    if (!game) return;

    if (buyActionDisabledReason) {
      setCombatMessage(buyActionDisabledReason);
      return;
    }

    setCombatMessage(null);
    setGame(buyTopActionCard(game));
  }

  function buyAdvancedCard(deckIndex: 0 | 1) {
    if (!game) return;
    setCombatMessage(null);
    setGame(buyAdvancedActionCard(game, deckIndex));
  }

  function cycleAdvancedCard(deckIndex: 0 | 1) {
    if (!game) return;
    setCombatMessage(null);
    setGame(cycleAdvancedDeckCard(game, deckIndex));
  }

  function buyPotion() {
    if (!game) return;
    setCombatMessage(null);
    setGame(buyPotionWithXp(game));
  }

  function rerollMana() {
    if (!game) return;
    setCombatMessage(null);
    setGame(rerollManaWithXp(game));
  }

  function rerollMovement() {
    if (!game) return;
    setGame(rerollMovementDiceWithXp(game));
  }

  function banishPlayedCard() {
    if (!game) return;
    setCombatMessage(null);
    setGame(banishPlayedCardWithXp(game));
  }

  function inspectCardFromHand(card: ActionCard, handIndex: number) {
    setInspectedCard(card);
    setInspectedHandIndex(handIndex);
  }

  function closeInspect() {
    setInspectedCard(null);
    setInspectedHandIndex(null);
  }

  function discardInspectedCardForMana() {
    if (!game || inspectedHandIndex === null) return;
    setCombatMessage(null);
    setGame(discardHandCardForMana(game, inspectedHandIndex));
  }

  const hasFloatingBar = false;

  return (
    <>
    <PWAPrompts />
    <main className={`shell game-shell${hasFloatingBar ? ' has-floating-bar' : ''}`} ref={shellRef} style={animationStyle}>
      <section className="status-bubbles" aria-label="Etat de partie">
        <span
          className={`status-bubble${healthDelta < 0 ? ' bubble-damaged' : healthDelta > 0 ? ' bubble-healed' : ''}`}
          key={`hp-${game.health}`}
          title={`Points de vie (plafond ${game.healthLimit})`}
        ><span aria-hidden="true">♥</span>{game.health}</span>
        <span
          className={`status-bubble${xpDelta > 0 ? ' bubble-gained' : ''}`}
          key={`xp-${game.xp}`}
          title="Experience"
        ><span aria-hidden="true">✦</span>{game.xp}</span>
        <span className="status-bubble" title="Potions"><span aria-hidden="true">✚</span>{game.potions}</span>
      </section>

      <section className="floating-actions" aria-label="Action principale" />

      <section className="utility-actions" aria-label="Actions utilitaires">
        <button onClick={() => setShowDecks(true)} title="Paquets" aria-label="Paquets">▤</button>
        <button onClick={() => setShowTowerStack(true)} title="Tours" aria-label="Tours">▦</button>
        <button onClick={() => setShowLog(true)} title="Journal" aria-label="Journal">☰</button>
        <button onClick={() => setGame(usePotion(game))} disabled={game.potions <= 0} title="Utiliser une potion" aria-label="Utiliser une potion">✚</button>
      </section>

      {showTowerStack && (
        <TowerStackOverlay game={game} onClose={() => setShowTowerStack(false)} setGame={setGame} />
      )}

      {showDecks && (
        <DecksOverlay
          buyActionDisabledReason={buyActionDisabledReason}
          game={game}
          onBuyAdvancedActionCard={buyAdvancedCard}
          onBuyActionCard={buyActionCard}
          onBuyPotion={buyPotion}
          onClose={() => setShowDecks(false)}
          onInspect={setInspectedCard}
        />
      )}


      <section className="play-area">
        <section className="panel board-panel">
          {game.activeBossCombat ? (
            <BossCombatZone
              boss={selectedBoss}
              bossCombat={game.activeBossCombat}
              bossCombatFeedback={game.bossCombatFeedback}
              deckNode={<>
                <div className="deck-strip-section" title={`Deck action — ${game.deck.length} carte(s)`}>
                  <div className="card-peek-wrapper">
                    <CardPeek card={topActionCard} emptyLabel="Deck vide" onInspect={setInspectedCard} />
                    {topActionCard && <span className="deck-count-badge">×{game.deck.length}</span>}
                    {canActInBossCombat && topActionCard && (
                      <button className="deck-buy-overlay-btn" onClick={buyActionCard}>Acheter · 1◆</button>
                    )}
                  </div>
                </div>
                {topAdvancedCards.map((card, index) => (
                  <div className="deck-strip-section" key={`strip-advanced-boss-${index}`} title={`Deck avancé ${index + 1}`}>
                    <div className="card-peek-wrapper">
                      <CardPeek card={card} emptyLabel="Vide" onInspect={setInspectedCard} />
                      {card && <span className="deck-count-badge">×{game.advancedDecks[index].length}</span>}
                      {card && (
                        <button
                          className="deck-buy-overlay-btn"
                          disabled={game.xp < 2 || game.hand.length >= 5 || Boolean(game.bossCombatFeedback)}
                          onClick={() => buyAdvancedCard(index as 0 | 1)}
                        >
                          2 XP
                        </button>
                      )}
                      {card && canActInBossCombat && (
                        <button
                          className="deck-cycle-overlay-btn"
                          disabled={(game.mana ?? 0) < 1 || Boolean(game.bossCombatFeedback)}
                          onClick={() => cycleAdvancedCard(index as 0 | 1)}
                          title="Passer la carte du dessus sous le deck"
                        >
                          Passer · 1◆
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="deck-strip-section" title={`Défausse — ${game.discard.length} carte(s)`}>
                  <DiscardList discard={game.discard} onInspect={setInspectedCard} />
                </div>
              </>}
              defense={game.activeBossCombat.defense}
              health={game.health}
              mana={game.mana}
              onEndPlayerPhase={() => setGame(endBossPlayerPhase(game))}
              onResolveBossAttack={() => setGame(resolveBossAttack(game))}
              onRollMana={() => setGame(rollBossMana(game))}
              onSelectDie={setSelectedBossDieIndex}
              onShowDecks={() => setShowDecks(true)}
              playerFeedback={game.playerFeedback}
              selectedDieIndex={selectedBossDieIndex}
              xp={game.xp}
              xpActionsNode={<>
                {canActInBossCombat && game.xp >= 1 && (
                  <button onClick={rerollMana}>Relancer mana · 1 XP</button>
                )}
                {game.banishableCardId && (
                  <button disabled={!canBanishPlayedCard(game)} onClick={banishPlayedCard}>Bannir carte jouée · 1 XP</button>
                )}
              </>}
            />
          ) : game.activeCombat && activeEnemies.length > 0 ? (
            <>
              <CombatZone
                activeEnemies={activeEnemies}
                canSelectEnemy={canActInCombat || hasPendingHit}
                combatFeedback={game.combatFeedback}
                combatPhase={game.activeCombat.phase}
                combatRound={game.activeCombat.round}
                defense={game.activeCombat.defense}
                deckNode={<>
                  <div className="deck-strip-section" title={`Deck action — ${game.deck.length} carte(s)`}>
                    <div className="card-peek-wrapper">
                      <CardPeek card={topActionCard} emptyLabel="Deck vide" onInspect={setInspectedCard} />
                      {topActionCard && <span className="deck-count-badge">×{game.deck.length}</span>}
                      {canActInCombat && topActionCard && (
                        <button className="deck-buy-overlay-btn" onClick={buyActionCard}>Acheter · 1◆</button>
                      )}
                    </div>
                  </div>
                  {topAdvancedCards.map((card, index) => (
                    <div className="deck-strip-section" key={`strip-advanced-${index}`} title={`Deck avance ${index + 1} — ${game.advancedDecks[index].length} carte(s)`}>
                      <div className="card-peek-wrapper">
                        <CardPeek card={card} emptyLabel="Vide" onInspect={setInspectedCard} />
                        {card && <span className="deck-count-badge">×{game.advancedDecks[index].length}</span>}
                        {card && (
                          <button
                            className="deck-buy-overlay-btn"
                            disabled={game.xp < 2 || game.hand.length >= 5 || Boolean(game.combatFeedback)}
                            onClick={() => buyAdvancedCard(index as 0 | 1)}
                          >
                            2 XP
                          </button>
                        )}
                        {card && canActInCombat && (
                          <button
                            className="deck-cycle-overlay-btn"
                            disabled={(game.mana ?? 0) < 1 || Boolean(game.combatFeedback)}
                            onClick={() => cycleAdvancedCard(index as 0 | 1)}
                            title="Passer la carte du dessus sous le deck"
                          >
                            Passer · 1◆
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="deck-strip-section" title={`Defausse — ${game.discard.length} carte(s)`}>
                    <DiscardList discard={game.discard} onInspect={setInspectedCard} />
                  </div>
                </>}
                health={game.health}
                mana={game.mana}
                playerFeedback={game.playerFeedback}
                onEndPlayerPhase={() => {
                  setCombatMessage(null);
                  setGame(endCombatRound(endPlayerPhase(game)));
                }}
                onResolveHaste={(manaSpent) => {
                  setCombatMessage(null);
                  setGame(resolveHasteAttack(game, manaSpent));
                }}
                onRollMana={() => {
                  setCombatMessage(null);
                  setGame(rollMana(game));
                }}
                pendingHasteAttack={game.pendingHasteAttack}
                onSelectEnemy={chooseEnemyTarget}
                onShowDecks={() => setShowDecks(true)}
                selectedEnemyInstanceId={selectedEnemyInstanceId}
                xp={game.xp}
                xpActionsNode={<>
                  {game.activeCombat?.phase === 'player' && game.mana !== null && !game.combatFeedback && game.xp >= 1 && (
                    <button onClick={rerollMana}>Relancer mana · 1 XP</button>
                  )}
                  {game.banishableCardId && (
                    <button disabled={!canBanishPlayedCard(game)} onClick={banishPlayedCard}>Bannir carte jouee · 1 XP</button>
                  )}
                </>}
              />
              {hasPendingHit && game.activeCombat && (
                <p className="status">Coup en attente : {game.activeCombat.pendingHits[0]} degats — selectionne une cible.</p>
              )}
              {combatMessage && <p className="status danger">{combatMessage}</p>}
            </>
          ) : (
            <>
              <TowerGrid
                game={game}
                isActiveTower
                animatedPosition={movementAnim ? movementAnim.pathCellIds[movementAnim.step] : undefined}
                movementOptions={movementAnim ? [] : movementOptions}
                onDestinationClick={handleDestinationClick}
                selectedPath={selectedPath}
                setGame={setGame}
                tower={currentTower}
              />
              {!game.activeCombat && game.phase === 'choose-path' && !movementAnim && (
                <div className="path-strip">
                  <button className="path-cancel" onClick={() => setGame(cancelMovementPath(game))} aria-label="Annuler">✕</button>
                  <button className="path-nav" onClick={() => cyclePath(-1)} aria-label="Chemin précédent">‹</button>
                  <span className="path-counter">{(game.selectedMovementPathIndex ?? 0) + 1} / {game.pendingMovementPaths.length}</span>
                  <button className="path-nav" onClick={() => cyclePath(1)} aria-label="Chemin suivant">›</button>
                  <button className="path-confirm" onClick={handleConfirmMovement} aria-label="Valider ce chemin">✓</button>
                  {canRerollMovementWithXp && (
                    <button className="path-reroll" onClick={rerollMovement}>↺ 1 XP</button>
                  )}
                </div>
              )}
              {!game.activeCombat &&
                !game.pendingCellRoll &&
                !game.pendingTrapLevelDiscard &&
                !game.trapFeedback &&
                !game.pendingTreasureChoice &&
                game.pendingCombatGroups.length === 0 &&
                game.pendingTraps.length === 0 &&
                game.pendingTreasures.length === 0 &&
                !game.pendingBossCellId &&
                game.phase === 'movement-roll' && (
                <section className="tower-action-panel" aria-label="Action de deplacement">
                  <button className="action-pulse" onClick={() => setGame(rollMovementDice(game))}>Lancer les des de deplacement</button>
                </section>
              )}
              {!game.activeCombat && game.phase === 'choose-destination' && game.movementDice && !movementAnim && (
                <section className="tower-action-panel" aria-label="Resultat du deplacement">
                  <div className="dice-roll" aria-label={`Des de deplacement ${game.movementDice[0]} et ${game.movementDice[1]}`}>
                    {game.movementDice.map((die, index) => <DieFace key={`movement-die-${index}`} value={die} />)}
                  </div>

                  <button disabled={!canRerollMovementWithXp} onClick={rerollMovement}>Relancer les des · 1 XP</button>
                </section>
              )}
              {game.pendingCellRoll && !showTrapIntro && !game.trapFeedback && (
                <section className={`resolution-panel${game.pendingCellRoll.kind === 'trap' ? ' trap-resolution' : ''}`} aria-label="Resolution en attente">
                  <p className="eyebrow">{game.pendingCellRoll.kind === 'trap' ? 'Piege' : 'Tresor'}</p>
                  <h3>{pendingCell?.label ?? 'Case a resoudre'}</h3>
                  <p className="muted">Lance le de pour reveler le resultat avant d'appliquer son effet.</p>
                  {game.pendingCellRoll.kind === 'trap' && <TrapReferenceCard />}
                  {game.pendingCellRoll.kind === 'treasure' && <TreasureReferenceCard />}
                  {rollingCellDie ? (
                    <RollingDie onSettle={() => {
                      setRollingCellDie(false);
                      setGame((g) => g ? rollPendingCellResolution(g) : g);
                    }} />
                  ) : (
                    <button className="action-pulse" onClick={() => setRollingCellDie(true)}>
                      Lancer le de
                    </button>
                  )}
                </section>
              )}
              {game.pendingTrapLevelDiscard && showTrapLevelIntro && (
                <section className="resolution-panel trap-resolution trap-level-intro" aria-live="assertive">
                  <p className="eyebrow">Piège niveau {game.pendingTrapLevelDiscard.level}</p>
                  <TrapReferenceCard
                    highlightedRoll={game.pendingTrapLevelDiscard.dieResult}
                    scanning
                  />
                </section>
              )}
              {game.pendingTrapLevelDiscard && !showTrapLevelIntro && (() => {
                const { level, manaBonus, dieResult, discardedForBonus } = game.pendingTrapLevelDiscard;
                const needed = level - manaBonus;
                const goodFaces = Math.min(6, Math.max(0, 7 - Math.max(1, needed)));
                const pct = Math.round((goodFaces / 6) * 100);
                const chanceLabel = needed <= 1
                  ? '✓ Aucun dégât garanti (6/6)'
                  : needed > 6
                  ? `Dégâts inévitables · min ${needed - 6} dégât(s)`
                  : `Jet ≥ ${needed} · ${goodFaces}/6 chances (${pct}%)`;
                return (
                  <section className="resolution-panel trap-resolution" aria-label="Piege niveau - defausse optionnelle">
                    <p className="eyebrow">Piège niveau {level}</p>
                    <p className="muted">
                      Tu peux défausser des cartes de ta main pour ajouter leur coût en mana au jet de protection.
                    </p>
                    <p className="trap-chance-formula">{chanceLabel}</p>
                    <div className="trap-resolve-row">
                      <button
                        className="action-pulse"
                        onClick={() => setGame(resolveTrapLevelWithBonus(game))}
                      >
                        Lancer le dé de protection
                        {manaBonus > 0 && ` (+${manaBonus})`}
                      </button>
                      {discardedForBonus.length > 0 && (
                        <button
                          className="trap-undo-discard"
                          onClick={() => setGame(undoTrapDiscard(game))}
                        >
                          ↩ Annuler
                        </button>
                      )}
                    </div>
                  </section>
                );
              })()}
              {game.pendingTreasureChoice && (
                <section className="resolution-panel treasure-choice-panel" aria-label="Choix de carte tresor">
                  <p className="eyebrow">Trésor {game.pendingTreasureChoice.dieResult}</p>
                  <h3>{game.pendingTreasureChoice.cellLabel}</h3>
                  <p className="muted">
                    Choisis {game.pendingTreasureChoice.remaining > 1 ? `${game.pendingTreasureChoice.remaining} cartes` : 'une carte'} à récupérer depuis {game.pendingTreasureChoice.source === 'deck' ? 'le deck action' : 'la défausse action'} :
                  </p>
                  <div className="treasure-card-choices">
                    {game.pendingTreasureChoice.candidates.map((cardId, index) => {
                      const cardRaw = getAction(cardId);
                      const card = cardRaw ? resolveCardForDisplay(cardRaw, game.flippedCards) : null;
                      if (!card) return null;
                      return (
                        <button
                          key={`treasure-choice-${cardId}-${index}`}
                          className="treasure-choice-card-btn"
                          onClick={() => setGame(chooseTreasureCard(game, cardId))}
                        >
                          <span className="tcc-name">{card.text}</span>
                          {card.manaCost !== null && <span className="tcc-mana">{card.manaCost} ◆</span>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
              {game.trapFeedback && (
                <section className="trap-feedback-panel" aria-live="assertive" key={`tf-${game.trapFeedback.dieResult}-${game.trapFeedback.defenseRoll ?? 0}-${game.trapFeedback.consequence}`}>
                  <p className="eyebrow">{describeTrapConsequenceTitle(game.trapFeedback)}</p>
                  {game.trapFeedback.consequence === 'level-trap' ? (() => {
                    const { defenseRoll, manaBonus = 0, trapLevel = 0, damage } = game.trapFeedback;
                    const effective = (defenseRoll ?? 0) + manaBonus;
                    const success = damage === 0;
                    return (
                      <>
                        <div className="trap-level-result">
                          <div className="dice-roll">
                            <DieFace value={defenseRoll!} modifier="trap-defense-die" />
                          </div>
                          {manaBonus > 0 && (
                            <span className="trap-level-bonus">+ {manaBonus} bonus</span>
                          )}
                          <span className="trap-level-total"
                            style={{ color: success ? '#86efac' : '#fca5a5' }}>
                            = {effective} {success ? '≥' : '<'} {trapLevel}
                          </span>
                        </div>
                        <p className={`trap-feedback-consequence${success ? ' trap-consequence-ok' : ' trap-consequence-damage'}`}>
                          {success ? 'Protection réussie — aucun dégât !' : `${damage} dégât${damage > 1 ? 's' : ''} subi${damage > 1 ? 's' : ''} !`}
                        </p>
                      </>
                    );
                  })() : (
                    <>
                      <div className="dice-roll trap-feedback-dice">
                        <DieFace value={game.trapFeedback.dieResult} />
                      </div>
                      <TrapReferenceCard highlightedRoll={game.trapFeedback.dieResult} />
                      <p className={`trap-feedback-consequence${game.trapFeedback.damage > 0 ? ' trap-consequence-damage' : ' trap-consequence-ok'}`}>
                        {describeTrapConsequence(game.trapFeedback)}
                      </p>
                    </>
                  )}
                  <button
                    className="action-pulse"
                    onClick={() => setGame(clearTrapFeedback(game))}
                  >
                    Continuer
                  </button>
                </section>
              )}
              {game.treasureFeedback && (
                <section className="treasure-feedback-panel" aria-live="assertive" key={`trf-${game.treasureFeedback.dieResult}-${game.treasureFeedback.consequence}`}>
                  <p className="eyebrow">Résultat du trésor</p>
                  <div className="dice-roll">
                    <DieFace value={game.treasureFeedback.dieResult} modifier="treasure-die" />
                  </div>
                  <TreasureReferenceCard highlightedRoll={game.treasureFeedback.dieResult} />
                  <p className="treasure-feedback-consequence">
                    {describeTreasureConsequence(game.treasureFeedback)}
                  </p>
                </section>
              )}
              <p className="eyebrow tower-footer-info">{selectedBoss?.name ?? 'Boss'} · Tour {towerProgress} · Séquence {game.towerSequenceCount}/3</p>
              {game.phase === 'victory' && <p className="status win">Victoire prototype.</p>}
            </>
          )}
        </section>
      </section>

      {showTrapIntro && (
        <div className="trap-intro-overlay" aria-live="assertive" role="alert">
          <div className="trap-intro-card">
            <span className="trap-intro-icon" aria-hidden="true">⚠</span>
            <p className="trap-intro-title">Piège !</p>
            <p className="trap-intro-sub">Résolution en cours…</p>
          </div>
        </div>
      )}

      <section className="game-info-grid">
        <HandDock
          game={game}
          onInspectCard={inspectCardFromHand}
          onPlayCard={playCardFromHand}
          onDiscardForTrap={game.pendingTrapLevelDiscard
            ? (cardId, handIndex) => setGame(discardCardForTrapBonus(game, handIndex))
            : undefined}
          trapDiscardAnimCardId={
            game.trapFeedback?.consequence === 'discard-hand'
              ? game.trapFeedback.discardedCardId
              : undefined
          }
          unaffordableCardIds={unplayableCardIds}
        />

        {showLog && (
          <LogOverlay game={game} onClose={() => setShowLog(false)} onNewGame={startNewGame} />
        )}
      </section>

      {game.phase === 'game-over' && (
        <div aria-label="Défaite" aria-modal="true" className="game-over-overlay" role="dialog">
          <div className="game-over-card">
            <span aria-hidden="true" className="game-over-icon">💀</span>
            <h2 className="game-over-title">Défaite</h2>
            <p className="game-over-text">L'aventurière a succombé à ses blessures.</p>
            <button className="primary-button game-over-restart" onClick={startNewGame} type="button">
              Nouvelle partie
            </button>
          </div>
        </div>
      )}

      <CardInspectOverlay
        card={inspectedCard}
        canUpgrade={inspectedCard ? canUpgradeCard(game, inspectedCard.id) : false}
        discardDisabled={inspectedHandIndex === null || Boolean(getDiscardForManaDisabledReason(game, inspectedHandIndex ?? 0))}
        flippedCards={game.flippedCards}
        onClose={closeInspect}
        onDiscardForMana={game.activeCombat && inspectedHandIndex !== null ? discardInspectedCardForMana : undefined}
        onPlay={game.activeCombat && inspectedHandIndex !== null ? () => playCardFromHand(inspectedCard!.id) : undefined}
        onUpgrade={(cardId) => setGame(upgradeCard(game, cardId))}
        playDisabledReason={(() => {
          if (!game.activeCombat || inspectedHandIndex === null || !inspectedCard) return null;
          if (game.combatFeedback) return 'Résolution en cours.';
          if (game.activeCombat.phase !== 'player') return 'Attends la phase joueuse.';
          if (game.mana === null) return "Lance d'abord le dé de mana.";
          const resolved = resolveCardForDisplay(inspectedCard, game.flippedCards);
          if (resolved.manaCost != null && resolved.manaCost > game.mana) return `Coût ${resolved.manaCost}, mana dispo ${game.mana}.`;
          if (cardNeedsTarget(inspectedCard, game.flippedCards) && !selectedEnemyInstanceId) return 'Sélectionne une cible.';
          return null;
        })()}
        xp={game.xp}
      />
    </main>
    </>
  );
}
