import { useState } from 'react';
import type React from 'react';
import type { CombatFeedback, CombatPhase, EnemyCard, PlayerFeedback } from '../game/types';
import { formatValue } from '../ui/formatters';
import { EnemyCardDisplay } from './EnemyCard';

export function CombatZone({ activeEnemies, canSelectEnemy, combatFeedback, combatPhase, combatRound, defense, deckNode, health, mana, onEndPlayerPhase, onResolveHaste, onRollMana, onSelectEnemy, pendingHasteAttack, playerFeedback, selectedEnemyInstanceId, xpActionsNode }: {
  activeEnemies: Array<{ instanceId: string; enemyId: string; enemyHealth: number; resolvedAttack: number; card: EnemyCard | undefined; isUntargetable?: boolean }>;
  canSelectEnemy: boolean;
  combatFeedback: CombatFeedback | null;
  combatPhase: CombatPhase;
  combatRound: number;
  defense: number;
  deckNode?: React.ReactNode;
  health: number;
  mana: number | null;
  onEndPlayerPhase: () => void;
  onResolveHaste: (manaSpent: number) => void;
  onRollMana: () => void;
  onSelectEnemy: (enemyInstanceId: string) => void;
  pendingHasteAttack: number | null;
  playerFeedback: PlayerFeedback | null;
  selectedEnemyInstanceId: string | null;
  xpActionsNode?: React.ReactNode;
}) {
  const [hasteManaSept, setHasteManaSpent] = useState(0);
  const maxHasteBlock = Math.min(mana ?? 0, pendingHasteAttack ?? 0);
  return (
    <div className="combat-zone">
      <div className="combat-arena" style={{ '--n': activeEnemies.length } as CSSProperties}>
        <div className={`player-character-card${playerFeedback ? ' player-card-hit' : ''}`}>
          {playerFeedback && (
            <div className="player-hit-feedback" aria-live="assertive" key={`${playerFeedback.incomingDamage}-${playerFeedback.net}`}>
              <span className="player-hit-icon">⚔</span>
              <span className="player-hit-detail">
                {playerFeedback.incomingDamage} ATT
                {playerFeedback.blocked > 0 && <> − {playerFeedback.blocked} DEF</>}
                {' = '}
                {playerFeedback.net === 0
                  ? <strong className="player-hit-zero">Bloque !</strong>
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
              <span className="player-stat-bubble player-def-stat" aria-label={`${defense} defense`}>
                <span className="bubble-value">{defense}</span>
                <span className="bubble-label">⛨ DEF</span>
              </span>
            )}
          </div>

          <strong>Aventuriere</strong>

          <div className="player-card-art" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="14" r="9" fill="currentColor" />
              <path d="M18 58 C18 38 46 38 46 58 Z" fill="currentColor" />
              <path d="M8 32 L20 40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <path d="M44 40 L56 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          {mana !== null && (
            <div className="dice-roll player-mana-roll" aria-label={`Mana : ${mana}`}>
              <span className="die-face mana-die">{mana}</span>
              <span className="player-mana-label">Mana</span>
            </div>
          )}
        </div>

        <div className="combat-center">
          {deckNode && <div className="combat-deck-strip" aria-label="Paquets de cartes">{deckNode}</div>}
          <div className="combat-center-actions">
            <span className="combat-round-chip">Round {combatRound}</span>
            <div className="combat-action-row">
              {combatFeedback?.combatEnded && <span className="combat-end-badge">Combat termine</span>}
              {!combatFeedback && combatPhase === 'roll-mana' && <button className="action-pulse" onClick={onRollMana}>Lancer le de de mana</button>}
              {!combatFeedback && combatPhase === 'player' && <button onClick={onEndPlayerPhase}>Passer a la phase ennemie</button>}
              {!combatFeedback && combatPhase === 'haste' && pendingHasteAttack !== null && (
                <div className="haste-attack-panel">
                  <p className="eyebrow haste-label">Hâte — Attaque immédiate</p>
                  <p className="haste-damage-line">
                    <strong>{Math.max(0, pendingHasteAttack - hasteManaSept)}</strong> dégât(s)
                    {hasteManaSept > 0 && <> — {hasteManaSept} mana bloqués</>}
                  </p>
                  <div className="haste-mana-stepper">
                    <button disabled={hasteManaSept <= 0} onClick={() => setHasteManaSpent((v) => Math.max(0, v - 1))}>−</button>
                    <span>{hasteManaSept} / {maxHasteBlock} mana</span>
                    <button disabled={hasteManaSept >= maxHasteBlock} onClick={() => setHasteManaSpent((v) => Math.min(maxHasteBlock, v + 1))}>+</button>
                  </div>
                  <button className="action-pulse" onClick={() => { onResolveHaste(hasteManaSept); setHasteManaSpent(0); }}>
                    Résoudre la Hâte
                  </button>
                </div>
              )}
              {xpActionsNode}
            </div>
          </div>
        </div>

        <div className="enemy-target-grid">
          {activeEnemies.map((enemy) => (
            <EnemyCardDisplay
              card={enemy.card}
              combatRound={combatRound}
              currentHealth={enemy.enemyHealth}
              disabled={!canSelectEnemy}
              feedback={combatFeedback?.targetInstanceId === enemy.instanceId ? combatFeedback : null}
              isInteractive
              isSelected={enemy.instanceId === selectedEnemyInstanceId}
              isUntargetable={enemy.isUntargetable}
              key={enemy.instanceId}
              onSelect={() => onSelectEnemy(enemy.instanceId)}
              resolvedAttack={enemy.resolvedAttack}
            />
          ))}
        </div>
      </div>

      {combatFeedback && <p className="muted">Resolution en cours...</p>}
    </div>
  );
}
