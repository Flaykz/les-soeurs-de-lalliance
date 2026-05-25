import type React from 'react';
import type { ActiveBossCombat, BossCombatFeedback, BossCard, PlayerFeedback } from '../game/types';
import { DieFace } from './DieFace';

export function BossCombatZone({
  boss,
  bossCombat,
  bossCombatFeedback,
  deckNode,
  defense,
  health,
  mana,
  onEndPlayerPhase,
  onResolveBossAttack,
  onRollMana,
  onSelectDie,
  onShowDecks,
  onUsePotion,
  playerFeedback,
  potions,
  selectedDieIndex,
  xp,
  xpActionsNode,
}: {
  boss: BossCard | undefined;
  bossCombat: ActiveBossCombat;
  bossCombatFeedback: BossCombatFeedback | null;
  deckNode?: React.ReactNode;
  defense: number;
  health: number;
  mana: number | null;
  onEndPlayerPhase: () => void;
  onResolveBossAttack: () => void;
  onRollMana: () => void;
  onSelectDie: (index: number) => void;
  onShowDecks?: () => void;
  onUsePotion: () => void;
  playerFeedback: PlayerFeedback | null;
  potions: number;
  selectedDieIndex: number | null;
  xp: number;
  xpActionsNode?: React.ReactNode;
}) {
  const remainingDice = bossCombat.healthDice.filter((d) => d !== null).length;

  return (
    <div className="boss-combat-zone">

      <div className="boss-info-bar">
        <span className="boss-name">{boss?.name ?? 'Boss'}</span>
        {boss?.attack != null && (
          <span className="boss-atk-chip" title="Attaque du boss">⚔ {boss.attack}</span>
        )}
        {(boss?.healthGaugeRepeats ?? 1) === 2 && (
          <span className="boss-gauge-chip">Jauge {bossCombat.gaugeIndex + 1}/2</span>
        )}
        <span className="boss-dice-remaining">{remainingDice}/6 dés</span>
      </div>

      <div className="boss-health-dice-row" aria-label="Dés de vie du boss">
        {bossCombat.healthDice.map((dieValue, index) => {
          const isRemoved = dieValue === null;
          const isSelected = selectedDieIndex === index && !isRemoved;
          const isFeedback = bossCombatFeedback?.dieIndex === index;
          const classes = [
            'boss-health-die',
            isRemoved ? 'removed' : '',
            isSelected ? 'selected' : '',
            isFeedback && bossCombatFeedback?.dieRemoved ? 'just-removed' : '',
            isFeedback && !bossCombatFeedback?.dieRemoved ? 'missed' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              aria-label={isRemoved ? `Dé ${index + 1} éliminé` : `Dé ${index + 1} : valeur ${dieValue}${isSelected ? ', sélectionné' : ''}`}
              aria-pressed={isSelected}
              className={classes}
              disabled={isRemoved || bossCombat.phase !== 'player' || !!bossCombatFeedback}
              key={index}
              onClick={() => !isRemoved && onSelectDie(index)}
              type="button"
            >
              {isRemoved
                ? <span className="boss-die-removed-icon" aria-hidden="true">✕</span>
                : <span className="boss-die-value">{dieValue}</span>
              }
            </button>
          );
        })}
      </div>

      <div className="boss-combat-arena">
        <div className={`player-character-card${playerFeedback ? ' player-card-hit' : ''}`}>
          {playerFeedback && (
            <div className="player-hit-feedback" aria-live="assertive" key={`${playerFeedback.incomingDamage}-${playerFeedback.net}`}>
              <span className="player-hit-icon">⚔</span>
              <span className="player-hit-detail">
                {playerFeedback.incomingDamage} ATT
                {playerFeedback.blocked > 0 && <> − {playerFeedback.blocked} DEF</>}
                {' = '}
                {playerFeedback.net === 0
                  ? <strong className="player-hit-zero">Bloqué !</strong>
                  : <strong className="player-hit-net">−{playerFeedback.net} PV</strong>
                }
              </span>
            </div>
          )}

          <div className="player-card-stats-row">
            <span className="player-stat-bubble player-hp-stat" aria-label={`${health} points de vie`}>
              <span className="bubble-value">{health}</span>
              <span className="bubble-label">♥ PV</span>
            </span>
            {defense > 0 && (
              <span className="player-stat-bubble player-def-stat" aria-label={`${defense} défense`}>
                <span className="bubble-value">{defense}</span>
                <span className="bubble-label">⛨ DEF</span>
              </span>
            )}
          </div>

          <strong>Aventurière</strong>

          <button
            className="player-potion-btn"
            disabled={potions <= 0}
            onClick={onUsePotion}
            aria-label={`Utiliser une potion (${potions} restante${potions > 1 ? 's' : ''})`}
          >
            <span className="player-potion-icon">✚</span>
            {potions > 0 && <span className="player-potion-count">{potions}</span>}
          </button>

          <div className="player-bottom-row">
            {mana !== null && (
              <div className="dice-roll player-mana-roll" aria-label={`Mana : ${mana}`}>
                <DieFace value={mana} modifier="mana-die" />
                <span className="player-mana-label">Mana</span>
              </div>
            )}
            <div aria-label={`${xp} XP`} className="player-xp-stat">
              <span className="player-xp-value">{xp}</span>
              <span className="player-xp-label">XP</span>
            </div>
          </div>
        </div>

        <div className="combat-center">
          {deckNode && <div className="combat-deck-strip" aria-label="Paquets de cartes">{deckNode}</div>}
          <div className="combat-center-actions">
            <span className="combat-round-chip">Round {bossCombat.round}</span>
            <div className="combat-action-row">
              {!bossCombatFeedback && bossCombat.phase === 'roll-mana' && (
                <button className="action-pulse" onClick={onRollMana} type="button">
                  Lancer le dé de mana
                </button>
              )}
              {!bossCombatFeedback && bossCombat.phase === 'player' && (
                <button className="action-pulse" onClick={onEndPlayerPhase} type="button">
                  Passer à l'attaque du boss
                </button>
              )}
              {!bossCombatFeedback && bossCombat.phase === 'boss-attack' && (
                <button className="action-pulse boss-resolve-btn" onClick={onResolveBossAttack} type="button">
                  Résoudre l'attaque du boss
                </button>
              )}
              {xpActionsNode}
            </div>
            {onShowDecks && (
              <button className="secondary-button combat-show-decks-btn" onClick={onShowDecks} type="button">
                Voir decks
              </button>
            )}
          </div>
        </div>
      </div>

      {bossCombatFeedback && (
        <p className="muted boss-feedback-hint">
          {bossCombatFeedback.dieRemoved
            ? `Dé éliminé ! (${bossCombatFeedback.damage} ≥ ${bossCombat.healthDice[bossCombatFeedback.dieIndex] ?? '?'})`
            : `Dégâts insuffisants (${bossCombatFeedback.damage}).`
          }
        </p>
      )}
    </div>
  );
}
