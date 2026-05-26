import { useState, type CSSProperties } from 'react';
import type React from 'react';
import type { CombatFeedback, CombatPhase, EnemyCard, PlayerFeedback } from '../game/types';
import { formatValue } from '../ui/formatters';
import { DieFace } from './DieFace';
import { EnemyCardDisplay } from './EnemyCard';

export function CombatZone({ activeEnemies, canSelectEnemy, combatFeedback, combatPhase, combatRound, defense, deckNode, health, mana, xp, onEndPlayerPhase, onResolveHaste, onRollMana, onSelectEnemy, onShowDecks, onUsePotion, pendingHasteAttack, playerFeedback, potions, selectedEnemyInstanceId, xpActionsNode }: {
  activeEnemies: Array<{ instanceId: string; enemyId: string; enemyHealth: number; resolvedAttack: number; card: EnemyCard | undefined; isUntargetable?: boolean }>;
  canSelectEnemy: boolean;
  combatFeedback: CombatFeedback | null;
  combatPhase: CombatPhase;
  combatRound: number;
  defense: number;
  deckNode?: React.ReactNode;
  health: number;
  mana: number | null;
  xp: number;
  onEndPlayerPhase: () => void;
  onResolveHaste: (manaSpent: number) => void;
  onRollMana: () => void;
  onSelectEnemy: (enemyInstanceId: string) => void;
  onShowDecks?: () => void;
  onUsePotion: () => void;
  pendingHasteAttack: number | null;
  playerFeedback: PlayerFeedback | null;
  potions: number;
  selectedEnemyInstanceId: string | null;
  xpActionsNode?: React.ReactNode;
}) {
  const [hasteManaSept, setHasteManaSpent] = useState(0);
  const maxHasteBlock = Math.min(mana ?? 0, pendingHasteAttack ?? 0);
  return (
    <div className="combat-zone">
      <div className="combat-arena" style={{ '--n': activeEnemies.length } as CSSProperties}>
        <div className={`player-character-card${playerFeedback ? ' player-card-hit' : ''}`} data-player-card>
          {playerFeedback?.hits?.map(({ damage }, i) => (
            <span
              aria-live="assertive"
              className="player-individual-hit"
              key={`hit-${playerFeedback.net}-${i}`}
              style={{ '--hit-delay': `${i * 400 + 360}ms` } as CSSProperties}
            >
              −{damage}
            </span>
          ))}

          <div className="player-card-stats-row">
            <span className={`player-stat-bubble player-hp-stat${playerFeedback && playerFeedback.net > 0 ? ' hp-damaged' : ''}`} key={`hp-${health}`} aria-label={`${health} points de vie`}>
              <span className="bubble-value">{health}</span>
              <span className="bubble-label">♥ PV</span>
            </span>
            {defense > 0 && (
              <span className="player-stat-bubble player-def-stat" aria-label={`${defense} defense`}>
                <span className="bubble-value">{defense}</span>
                <span className="bubble-label">🛡 DEF</span>
              </span>
            )}
          </div>

          <strong>Aventuriere</strong>

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
            <span className="combat-round-chip">Round {combatRound}</span>
            <div className="combat-action-row">
              {combatFeedback?.combatEnded && <span className="combat-end-badge">Combat termine</span>}
              {!combatFeedback && combatPhase === 'roll-mana' && <button className="action-pulse" onClick={onRollMana}>Lancer le de de mana</button>}
              {!combatFeedback && combatPhase === 'player' && <button className="action-pulse" onClick={onEndPlayerPhase}>Passer a la phase ennemie</button>}
              {!combatFeedback && combatPhase === 'haste' && pendingHasteAttack !== null && (
                <div className="haste-attack-panel">
                  <p className="eyebrow haste-label">Hâte — Attaque immédiate</p>
                  <p className="haste-damage-line">
                    <strong>{Math.max(0, pendingHasteAttack - hasteManaSept)}</strong> dégât(s)
                    {hasteManaSept > 0 && <> — {hasteManaSept} mana bloqués</>}
                  </p>
                  <div className="haste-mana-stepper">
                    <button className="stepper-btn" disabled={hasteManaSept <= 0} onClick={() => setHasteManaSpent((v) => Math.max(0, v - 1))}>−</button>
                    <span>{hasteManaSept} / {maxHasteBlock} mana</span>
                    <button className="stepper-btn" disabled={hasteManaSept >= maxHasteBlock} onClick={() => setHasteManaSpent((v) => Math.min(maxHasteBlock, v + 1))}>+</button>
                  </div>
                  <button className="action-pulse" onClick={() => { onResolveHaste(hasteManaSept); setHasteManaSpent(0); }}>
                    Résoudre la Hâte
                  </button>
                </div>
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

        <div className="enemy-target-grid">
          {activeEnemies.map((enemy) => (
            <EnemyCardDisplay
              card={enemy.card}
              combatRound={combatRound}
              currentHealth={enemy.enemyHealth}
              disabled={!canSelectEnemy}
              feedback={combatFeedback?.targetInstanceId === enemy.instanceId ? combatFeedback : null}
              instanceId={enemy.instanceId}
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
