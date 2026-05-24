import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { BossSelection } from './components/BossSelection';
import { CardPeek, DiscardList } from './components/CardCatalog';
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
  canBanishPlayedCard,
  chooseMovementDestination,
  isCombatTargetUntargetable,
  resolveHasteAttack,
  chooseMovementPath,
  clearPlayerFeedback,
  chooseTreasureCard,
  clearTrapFeedback,
  clearTreasureFeedback,
  completeCombatFeedback,
  confirmMovementPath,
  describeMovementPath,
  discardCardForTrapBonus,
  discardHandCardForMana,
  resolveTrapLevelWithBonus,
  endCombatRound,
  endPlayerPhase,
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

const ANIMATION_SPEED_KEY = 'lsa-animation-speed';

export function App() {
  const [game, setGame] = useState<GameState | null>(() => loadSavedGame());
  const [showLog, setShowLog] = useState(false);
  const [showTowerStack, setShowTowerStack] = useState(false);
  const [showDecks, setShowDecks] = useState(false);
  const [selectedEnemyInstanceId, setSelectedEnemyInstanceId] = useState<string | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [combatMessage, setCombatMessage] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<ActionCard | null>(null);
  const [movementAnim, setMovementAnim] = useState<{ pathCellIds: string[]; step: number; pendingGame: GameState } | null>(null);
  const [showTrapIntro, setShowTrapIntro] = useState(false);
  const prevHealthRef = useRef<number | null>(null);
  const prevXpRef = useRef<number | null>(null);
  const prevPendingCellRollRef = useRef<GameState['pendingCellRoll'] | null>(null);
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
    if (!game || selectedHandIndex === null) return;
    if (selectedHandIndex >= game.hand.length) setSelectedHandIndex(null);
  }, [game, selectedHandIndex]);

  useEffect(() => {
    if (!game?.combatFeedback) return;
    const durations = animationDurations[animationSpeed];
    const timeout = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.combatFeedback ? completeCombatFeedback(currentGame) : currentGame);
    }, game.combatFeedback.combatEnded ? durations.combatEnd : game.combatFeedback.defeated ? durations.defeat : durations.damage);
    return () => window.clearTimeout(timeout);
  }, [animationSpeed, game?.combatFeedback]);

  useEffect(() => {
    if (!game?.playerFeedback) return;
    const durations = animationDurations[animationSpeed];
    const timeout = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.playerFeedback ? clearPlayerFeedback(currentGame) : currentGame);
    }, durations.playerFeedback);
    return () => window.clearTimeout(timeout);
  }, [animationSpeed, game?.playerFeedback]);

  useEffect(() => {
    if (!game?.trapFeedback) return;
    const duration = animationDurations[animationSpeed].trapFeedback;
    const timer = window.setTimeout(() => {
      setGame((currentGame) => currentGame?.trapFeedback ? clearTrapFeedback(currentGame) : currentGame);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [animationSpeed, game?.trapFeedback]);

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

  useLayoutEffect(() => {
    if (!game) return;
    prevHealthRef.current = game.health;
    prevXpRef.current = game.xp;
  });

  if (!game) {
    return (
      <BossSelection
        animationSpeed={animationSpeed}
        onAnimationSpeedChange={setAnimationSpeed}
        onStartGame={setGame}
      />
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
  const buyActionDisabledReason = getBuyActionDisabledReason(game);
  const canRerollMovementWithXp = game.xp >= 1 && Boolean(game.movementDice) && (game.phase === 'choose-destination' || game.phase === 'choose-path') && !game.activeCombat;
  const showExplorationSequence = !game.activeCombat && game.phase !== 'victory' && game.phase !== 'game-over';
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
    }
    setGame(nextGame);
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
    setSelectedHandIndex(null);
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
    if (!game?.activeCombat) return;

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

    if (!selectedEnemyInstanceId) {
      setCombatMessage("Selectionne d'abord un ennemi avant de jouer une carte.");
      return;
    }

    setCombatMessage(null);
    setSelectedHandIndex(null);
    setGame(playActionCard(game, cardId, selectedEnemyInstanceId));
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

  function discardSelectedCardForMana() {
    if (!game || selectedHandIndex === null) return;

    const disabledReason = getDiscardForManaDisabledReason(game, selectedHandIndex);
    if (disabledReason) {
      setCombatMessage(disabledReason);
      return;
    }

    setCombatMessage(null);
    setSelectedHandIndex(null);
    setGame(discardHandCardForMana(game, selectedHandIndex));
  }

  return (
    <main className="shell game-shell" style={animationStyle}>
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
        {showExplorationSequence && <span className="status-bubble" title="Sequence"><span aria-hidden="true">⇧</span>{game.towerSequenceCount}/3</span>}
      </section>

      <section className="floating-actions" aria-label="Action principale">
        {!game.activeCombat && game.phase === 'choose-path' && !movementAnim && (
          <div className="path-choice compact-path-choice">
            {game.pendingMovementPaths.map((movement, index) => (
              <button
                className={index === game.selectedMovementPathIndex ? 'selected' : ''}
                key={`${movement.steps}-${movement.cellIds.join('-')}`}
                onClick={() => setGame(chooseMovementPath(game, index))}
              >
                {movement.steps} · {describeMovementPath(game, movement)}
              </button>
            ))}
            <button className="primary-icon-action" onClick={handleConfirmMovement} title="Valider ce chemin" aria-label="Valider ce chemin">✓</button>
            <button disabled={!canRerollMovementWithXp} onClick={rerollMovement}>Relancer · 1 XP</button>
          </div>
        )}
      </section>

      <section className="utility-actions" aria-label="Actions utilitaires">
        <button onClick={() => setShowDecks(true)} title="Paquets" aria-label="Paquets">▤</button>
        <button onClick={() => setShowTowerStack(true)} title="Tours" aria-label="Tours">▦</button>
        <button onClick={() => setShowLog(true)} title="Journal" aria-label="Journal">☰</button>
        <button onClick={() => setGame(usePotion(game))} disabled={game.potions <= 0} title="Utiliser une potion" aria-label="Utiliser une potion">✚</button>
        <button onClick={buyPotion} disabled={game.xp < 3 || game.potions >= 3} title="Acheter une potion pour 3 XP" aria-label="Acheter une potion pour 3 XP">✚XP</button>
        <button onClick={startNewGame} title="Nouvelle partie" aria-label="Nouvelle partie">↻</button>
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
          onClose={() => setShowDecks(false)}
          onInspect={setInspectedCard}
        />
      )}


      <section className="play-area">
        <section className="panel board-panel">
          {game.activeCombat && activeEnemies.length > 0 ? (
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
                selectedEnemyInstanceId={selectedEnemyInstanceId}
                xpActionsNode={<>
                  {game.activeCombat?.phase === 'player' && game.mana !== null && !game.combatFeedback && (
                    <button disabled={game.xp < 1} onClick={rerollMana}>Relancer mana · 1 XP</button>
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
              <p className="eyebrow">{selectedBoss?.name ?? 'Boss'} · Tour {towerProgress} · Sequence {game.towerSequenceCount}/3</p>
              <h2>{currentTower.name}</h2>
              {game.phase === 'victory' && <p className="status win">Victoire prototype.</p>}
              {game.phase === 'game-over' && <p className="status danger">Defaite.</p>}
              {!game.activeCombat && !game.pendingCellRoll && game.phase === 'movement-roll' && (
                <section className="tower-action-panel" aria-label="Action de deplacement">
                  <button className="action-pulse" onClick={() => setGame(rollMovementDice(game))}>Lancer les des de deplacement</button>
                </section>
              )}
              {!game.activeCombat && game.phase === 'choose-destination' && game.movementDice && !movementAnim && (
                <section className="tower-action-panel" aria-label="Resultat du deplacement">
                  <div className="dice-roll" aria-label={`Des de deplacement ${game.movementDice[0]} et ${game.movementDice[1]}`}>
                    {game.movementDice.map((die, index) => <span className="die-face" key={`movement-die-${index}-${die}`}>{die}</span>)}
                  </div>
                  <p className="muted">Choisis une case jaune. Le de utilise sera deduit automatiquement.</p>
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
                  <button className="action-pulse" onClick={() => setGame(rollPendingCellResolution(game))}>Lancer le de</button>
                </section>
              )}
              {game.pendingTrapLevelDiscard && (
                <section className="resolution-panel trap-resolution" aria-label="Piege niveau - defausse optionnelle">
                  <p className="eyebrow">Piège niveau {game.pendingTrapLevelDiscard.level}</p>
                  <h3>{game.pendingTrapLevelDiscard.cellLabel}</h3>
                  <p className="muted">
                    Résultat du dé : <strong>{game.pendingTrapLevelDiscard.dieResult}</strong>.
                    Tu peux défausser des cartes de ta main pour ajouter leur coût en mana au jet de protection.
                  </p>
                  {game.pendingTrapLevelDiscard.manaBonus > 0 && (
                    <p className="trap-mana-bonus">Bonus actuel : +{game.pendingTrapLevelDiscard.manaBonus} mana</p>
                  )}
                  {game.hand.length > 0 && (
                    <div className="trap-discard-hand">
                      <p className="muted small">Cartes en main (clique pour défausser) :</p>
                      <div className="trap-discard-cards">
                        {game.hand.map((cardId, index) => {
                          const cardRaw = getAction(cardId);
                          const card = cardRaw ? resolveCardForDisplay(cardRaw, game.flippedCards) : null;
                          if (!card) return null;
                          return (
                            <button
                              key={`trap-discard-${cardId}-${index}`}
                              className="trap-discard-card-btn"
                              onClick={() => setGame(discardCardForTrapBonus(game, index))}
                            >
                              <span className="tdc-name">{card.text}</span>
                              <span className="tdc-mana">+{card.manaCost ?? 0}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    className="action-pulse"
                    onClick={() => setGame(resolveTrapLevelWithBonus(game))}
                  >
                    Lancer le dé de protection
                    {game.pendingTrapLevelDiscard.manaBonus > 0 && ` (+${game.pendingTrapLevelDiscard.manaBonus})`}
                  </button>
                </section>
              )}
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
                  <div className="dice-roll trap-feedback-dice">
                    <span className="die-face">{game.trapFeedback.dieResult}</span>
                    {game.trapFeedback.defenseRoll !== undefined && (
                      <>
                        <span className="trap-dice-vs" aria-hidden="true">vs</span>
                        <span className="die-face trap-defense-die">{game.trapFeedback.defenseRoll}</span>
                      </>
                    )}
                  </div>
                  <TrapReferenceCard highlightedRoll={game.trapFeedback.dieResult} />
                  <p className={`trap-feedback-consequence${game.trapFeedback.damage > 0 ? ' trap-consequence-damage' : ' trap-consequence-ok'}`}>
                    {describeTrapConsequence(game.trapFeedback)}
                  </p>
                </section>
              )}
              {game.treasureFeedback && (
                <section className="treasure-feedback-panel" aria-live="assertive" key={`trf-${game.treasureFeedback.dieResult}-${game.treasureFeedback.consequence}`}>
                  <p className="eyebrow">Résultat du trésor</p>
                  <div className="dice-roll">
                    <span className="die-face treasure-die">{game.treasureFeedback.dieResult}</span>
                  </div>
                  <TreasureReferenceCard highlightedRoll={game.treasureFeedback.dieResult} />
                  <p className="treasure-feedback-consequence">
                    {describeTreasureConsequence(game.treasureFeedback)}
                  </p>
                </section>
              )}
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
              <p className="muted">Position actuelle : {currentCell.label}</p>
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
          onDiscardForMana={discardSelectedCardForMana}
          onInspectCard={setInspectedCard}
          onPlayCard={playCardFromHand}
          onSelectCard={setSelectedHandIndex}
          selectedEnemyInstanceId={selectedEnemyInstanceId}
          selectedHandIndex={selectedHandIndex}
        />

        {showLog && (
          <LogOverlay game={game} onClose={() => setShowLog(false)} />
        )}
      </section>

      <CardInspectOverlay
        card={inspectedCard}
        canUpgrade={inspectedCard ? canUpgradeCard(game, inspectedCard.id) : false}
        flippedCards={game.flippedCards}
        onClose={() => setInspectedCard(null)}
        onUpgrade={(cardId) => setGame(upgradeCard(game, cardId))}
        xp={game.xp}
      />
    </main>
  );
}
