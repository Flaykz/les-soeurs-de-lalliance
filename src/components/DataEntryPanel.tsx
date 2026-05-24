import { useEffect, useState } from 'react';
import { baseActions, baseEnemies } from '../data/baseSet';
import type { ActionCard, ActionEffect, EnemyCard } from '../game/types';
import { formatValue } from '../ui/formatters';
import { FlippableCardTile } from './CardCatalog';

// ── Storage ───────────────────────────────────────────────────────────────────

const ACTION_STORAGE_KEY = 'level2-drafts';
const ENEMY_STORAGE_KEY = 'enemy-drafts';

// ── Action card draft types ───────────────────────────────────────────────────

type EffectDraft = {
  damage: string; defense: string; heal: string; draw: string;
  mana: string; selfDamage: string;
  damageTopDeck: boolean; rerollMana: boolean; discardRandom: boolean;
};

type CardDraft = { manaCost: string; effects: EffectDraft; text: string; };
type CardDrafts = Record<string, CardDraft>;

function emptyCardDraft(): CardDraft {
  return {
    manaCost: '',
    effects: {
      damage: '', defense: '', heal: '', draw: '', mana: '', selfDamage: '',
      damageTopDeck: false, rerollMana: false, discardRandom: false,
    },
    text: '',
  };
}

function draftToEffects(e: EffectDraft): ActionEffect[] {
  const out: ActionEffect[] = [];
  if (e.damageTopDeck) out.push({ kind: 'damage-top-deck' });
  if (e.rerollMana) out.push({ kind: 'reroll-mana' });
  if (e.discardRandom) out.push({ kind: 'discard-random' });
  const d = parseInt(e.damage); if (d > 0) out.push({ kind: 'damage', value: d });
  const def = parseInt(e.defense); if (def > 0) out.push({ kind: 'defense', value: def });
  const h = parseInt(e.heal); if (h > 0) out.push({ kind: 'heal', value: h });
  const dr = parseInt(e.draw); if (dr > 0) out.push({ kind: 'draw', value: dr });
  const m = parseInt(e.mana); if (m > 0) out.push({ kind: 'mana', value: m });
  const sd = parseInt(e.selfDamage); if (sd > 0) out.push({ kind: 'self-damage', value: sd });
  return out;
}

function draftToLevel2(draft: CardDraft): ActionCard['level2'] | undefined {
  const effects = draftToEffects(draft.effects);
  if (effects.length === 0 && draft.text === '') return undefined;
  const manaCost = draft.manaCost === '' ? null : parseInt(draft.manaCost);
  return { manaCost, effects, text: draft.text };
}

// ── Enemy draft types ─────────────────────────────────────────────────────────

type EnemyDraft = {
  attack: string; health: string;
  xp1: string; xp2: string; xp3: string; xp4: string;
  text: string; traits: string;
};
type EnemyDrafts = Record<string, EnemyDraft>;

function emptyEnemyDraft(): EnemyDraft {
  return { attack: '', health: '', xp1: '', xp2: '', xp3: '', xp4: '', text: '', traits: '' };
}

function isEnemyDraftFilled(d: EnemyDraft): boolean {
  return d.attack !== '' || d.health !== '' || d.xp1 !== '';
}

// ── Code generators ───────────────────────────────────────────────────────────

function generateActionsTs(drafts: CardDrafts): string {
  const lines: string[] = [
    `import type { ActionCard } from '../game/types';`,
    ``,
    `export const baseActions: ActionCard[] = [`,
    ``,
    `  // ── CARTES ACTION DE BASE (16 cartes) ──────────────────────────────────────`,
  ];

  for (const card of baseActions) {
    const level2 = draftToLevel2(drafts[card.id] ?? emptyCardDraft()) ?? card.level2;
    lines.push(`  {`);
    lines.push(`    id: '${card.id}',`);
    lines.push(`    kind: '${card.kind}',`);
    lines.push(`    manaCost: ${card.manaCost === null ? 'null' : card.manaCost},`);
    lines.push(`    effects: ${JSON.stringify(card.effects)},`);
    lines.push(`    text: ${JSON.stringify(card.text)},`);
    if (level2) {
      lines.push(`    level2: {`);
      lines.push(`      manaCost: ${level2.manaCost === null ? 'null' : level2.manaCost},`);
      lines.push(`      effects: ${JSON.stringify(level2.effects)},`);
      lines.push(`      text: ${JSON.stringify(level2.text)},`);
      lines.push(`    },`);
    }
    if (card.notes) lines.push(`    notes: ${JSON.stringify(card.notes)},`);
    lines.push(`  },`);
    if (card.id === 'ch1-action-16') {
      lines.push(``, `  // ── CARTES ACTION AVANCÉES A1 (8 cartes) ──────────────────────────────────`);
    }
  }

  lines.push(`];`, ``);
  return lines.join('\n');
}

function parseStatValue(raw: string, fallback: number | '?' | null): number | '?' | null {
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  if (trimmed === '?') return '?';
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? fallback : n;
}

function serializeStat(v: number | '?' | null): string {
  if (v === null) return 'null';
  if (v === '?') return "'?'";
  return String(v);
}

function generateEnemiesTs(drafts: EnemyDrafts): string {
  const lines: string[] = [
    `import type { EnemyCard } from '../game/types';`,
    ``,
    `export const baseEnemies: EnemyCard[] = [`,
  ];

  for (const enemy of baseEnemies) {
    const d = drafts[enemy.id];
    const attack = parseStatValue(d?.attack ?? '', enemy.attack);
    const health = parseStatValue(d?.health ?? '', enemy.health);
    const xp1 = parseStatValue(d?.xp1 ?? '', enemy.xpByRound?.[0] ?? enemy.xpReward ?? 0) ?? 0;
    const xp2 = parseStatValue(d?.xp2 ?? '', enemy.xpByRound?.[1] ?? 0) ?? 0;
    const xp3 = parseStatValue(d?.xp3 ?? '', enemy.xpByRound?.[2] ?? 0) ?? 0;
    const xp4 = parseStatValue(d?.xp4 ?? '', enemy.xpByRound?.[3] ?? 0) ?? 0;
    const text = d?.text || enemy.text;
    const traits = d?.traits ? d.traits.split(',').map(t => t.trim()).filter(Boolean) : (enemy.traits ?? []);

    lines.push(`  {`);
    lines.push(`    id: '${enemy.id}',`);
    lines.push(`    kind: 'enemy',`);
    lines.push(`    attack: ${serializeStat(attack)},`);
    lines.push(`    health: ${serializeStat(health)},`);
    lines.push(`    xpReward: ${xp1},`);
    lines.push(`    xpByRound: [${xp1}, ${xp2}, ${xp3}, ${xp4}],`);
    lines.push(`    text: ${JSON.stringify(text)},`);
    if (traits.length > 0) lines.push(`    traits: ${JSON.stringify(traits)},`);
    lines.push(`  },`);
  }

  lines.push(`];`, ``);
  return lines.join('\n');
}

// ── Action card row ───────────────────────────────────────────────────────────

function CardDraftRow({ card, draft, onChange }: {
  card: ActionCard; draft: CardDraft; onChange: (d: CardDraft) => void;
}) {
  const level2 = draftToLevel2(draft);
  const previewCard: ActionCard = level2 ? { ...card, level2 } : card;

  function setEff(key: keyof EffectDraft, v: string | boolean) {
    onChange({ ...draft, effects: { ...draft.effects, [key]: v } });
  }

  return (
    <div className={`data-entry-row${level2 ? ' has-draft' : ''}`}>
      <div className="data-entry-ref">
        <strong className="data-entry-name">{card.id}</strong>
        <span className="data-entry-l1">
          Niv.1 — {formatValue(card.manaCost)}m · {card.effects.map(e =>
            e.kind === 'damage' ? `⚔${e.value}` :
            e.kind === 'defense' ? `🛡${e.value}` :
            e.kind === 'heal' ? `♥${e.value}` :
            e.kind === 'draw' ? `↑${e.value}` :
            e.kind === 'mana' ? `◆${e.value}` :
            e.kind === 'self-damage' ? `-♥${e.value}` :
            e.kind === 'damage-top-deck' ? '⚔?' :
            e.kind === 'reroll-mana' ? '↺◆' :
            e.kind === 'discard-random' ? '↓?' : ''
          ).join(' ')}
        </span>
      </div>

      <div className="data-entry-fields">
        <label className="data-entry-field-group">
          <span>Mana</span>
          <input className="data-entry-num" min={0} max={9} placeholder={String(card.manaCost ?? '?')} type="number"
            value={draft.manaCost} onChange={e => onChange({ ...draft, manaCost: e.target.value })} />
        </label>
        {(['damage','defense','heal','draw','mana','selfDamage'] as const).map(key => (
          <label className="data-entry-field-group" key={key}>
            <span>{key === 'damage' ? '⚔' : key === 'defense' ? '🛡' : key === 'heal' ? '♥' : key === 'draw' ? '↑' : key === 'mana' ? '◆' : '-♥'}</span>
            <input className="data-entry-num" min={0} max={20} placeholder="—" type="number"
              value={draft.effects[key]} onChange={e => setEff(key, e.target.value)} />
          </label>
        ))}
        {(['damageTopDeck','rerollMana','discardRandom'] as const).map(key => (
          <label className="data-entry-checkbox" key={key} title={key === 'damageTopDeck' ? 'Dégâts=top deck' : key === 'rerollMana' ? 'Relance mana' : 'Défausse aléatoire'}>
            <input checked={draft.effects[key]} type="checkbox" onChange={e => setEff(key, e.target.checked)} />
            <span>{key === 'damageTopDeck' ? '⚔?' : key === 'rerollMana' ? '↺◆' : '↓?'}</span>
          </label>
        ))}
        <input className="data-entry-text" placeholder="Texte niv.2…" type="text"
          value={draft.text} onChange={e => onChange({ ...draft, text: e.target.value })} />
      </div>

      <div className="data-entry-preview">
        <FlippableCardTile card={previewCard} />
      </div>
    </div>
  );
}

// ── Enemy row ─────────────────────────────────────────────────────────────────

function EnemyDraftRow({ enemy, draft, onChange }: {
  enemy: EnemyCard; draft: EnemyDraft; onChange: (d: EnemyDraft) => void;
}) {
  const filled = isEnemyDraftFilled(draft);
  const displayAtk = draft.attack !== '' ? draft.attack : formatValue(enemy.attack);
  const displayHp = draft.health !== '' ? draft.health : formatValue(enemy.health);
  const displayXp1 = draft.xp1 !== '' ? draft.xp1 : String(enemy.xpByRound?.[0] ?? enemy.xpReward ?? '?');

  return (
    <div className={`data-entry-row${filled ? ' has-draft' : ''}`}>
      <div className="data-entry-ref">
        <span className="data-entry-l1 muted">{enemy.id}</span>
        <span className="data-entry-l1">ref: ATQ {formatValue(enemy.attack)} / PV {formatValue(enemy.health)} / XP {(enemy.xpByRound ?? [enemy.xpReward]).join('·')}</span>
      </div>

      <div className="data-entry-fields">
        <label className="data-entry-field-group">
          <span>ATQ</span>
          <input className="data-entry-num" placeholder={String(enemy.attack ?? '?')} type="text"
            value={draft.attack} onChange={e => onChange({ ...draft, attack: e.target.value })} />
        </label>
        <label className="data-entry-field-group">
          <span>PV</span>
          <input className="data-entry-num" placeholder={String(enemy.health ?? '?')} type="text"
            value={draft.health} onChange={e => onChange({ ...draft, health: e.target.value })} />
        </label>
        <label className="data-entry-field-group">
          <span>XP R1</span>
          <input className="data-entry-num" min={0} max={10} placeholder={displayXp1} type="number"
            value={draft.xp1} onChange={e => onChange({ ...draft, xp1: e.target.value })} />
        </label>
        <label className="data-entry-field-group">
          <span>R2</span>
          <input className="data-entry-num" min={0} max={10} placeholder={String(enemy.xpByRound?.[1] ?? '?')} type="number"
            value={draft.xp2} onChange={e => onChange({ ...draft, xp2: e.target.value })} />
        </label>
        <label className="data-entry-field-group">
          <span>R3</span>
          <input className="data-entry-num" min={0} max={10} placeholder={String(enemy.xpByRound?.[2] ?? '?')} type="number"
            value={draft.xp3} onChange={e => onChange({ ...draft, xp3: e.target.value })} />
        </label>
        <label className="data-entry-field-group">
          <span>R4</span>
          <input className="data-entry-num" min={0} max={10} placeholder={String(enemy.xpByRound?.[3] ?? '?')} type="number"
            value={draft.xp4} onChange={e => onChange({ ...draft, xp4: e.target.value })} />
        </label>
        <input className="data-entry-text" placeholder="Texte / mot-clé…" type="text"
          value={draft.text} onChange={e => onChange({ ...draft, text: e.target.value })} />
        <input className="data-entry-text" placeholder="Traits séparés par virgule…" style={{ minWidth: 120 }} type="text"
          value={draft.traits} onChange={e => onChange({ ...draft, traits: e.target.value })} />
      </div>

      <div className="data-entry-preview data-entry-enemy-preview">
        <div className="data-entry-enemy-stat"><span>ATQ</span><strong>{displayAtk}</strong></div>
        <div className="data-entry-enemy-stat"><span>PV</span><strong>{displayHp}</strong></div>
        <div className="data-entry-enemy-stat"><span>XP</span><strong>{draft.xp1 || (enemy.xpByRound?.[0] ?? enemy.xpReward ?? '?')}·{draft.xp2 || (enemy.xpByRound?.[1] ?? '?')}·{draft.xp3 || (enemy.xpByRound?.[2] ?? '?')}·{draft.xp4 || (enemy.xpByRound?.[3] ?? '?')}</strong></div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Tab = 'actions' | 'enemies';

export function DataEntryPanel() {
  const [tab, setTab] = useState<Tab>('actions');

  const [cardDrafts, setCardDrafts] = useState<CardDrafts>(() => {
    try { return JSON.parse(localStorage.getItem(ACTION_STORAGE_KEY) ?? '{}'); }
    catch { return {}; }
  });
  const [enemyDrafts, setEnemyDrafts] = useState<EnemyDrafts>(() => {
    try { return JSON.parse(localStorage.getItem(ENEMY_STORAGE_KEY) ?? '{}'); }
    catch { return {}; }
  });

  const [exportedActions, setExportedActions] = useState(false);
  const [exportedEnemies, setExportedEnemies] = useState(false);

  useEffect(() => { localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(cardDrafts)); }, [cardDrafts]);
  useEffect(() => { localStorage.setItem(ENEMY_STORAGE_KEY, JSON.stringify(enemyDrafts)); }, [enemyDrafts]);

  function download(content: string, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = filename;
    a.click();
  }

  const actionsFilled = baseActions.filter(c => !!draftToLevel2(cardDrafts[c.id] ?? emptyCardDraft())).length;
  const enemiesFilled = baseEnemies.filter(e => isEnemyDraftFilled(enemyDrafts[e.id] ?? emptyEnemyDraft())).length;

  return (
    <section className="data-entry-panel">
      <div className="data-entry-header">
        <div>
          <h2>Saisie des données</h2>
          <p className="muted">Sauvegardé automatiquement dans le navigateur</p>
        </div>
      </div>

      <div className="data-entry-tabs">
        <button className={`data-entry-tab${tab === 'actions' ? ' active' : ''}`} onClick={() => setTab('actions')} type="button">
          Cartes action <span className="data-entry-count">{actionsFilled}/{baseActions.length}</span>
        </button>
        <button className={`data-entry-tab${tab === 'enemies' ? ' active' : ''}`} onClick={() => setTab('enemies')} type="button">
          Ennemis <span className="data-entry-count">{enemiesFilled}/{baseEnemies.length}</span>
        </button>
      </div>

      {tab === 'actions' && (
        <>
          <div className="data-entry-legend">
            <span>⚔ dégâts</span><span>🛡 défense</span><span>♥ soin</span>
            <span>↑ pioche</span><span>◆ +mana</span><span>-♥ auto-dégât</span>
            <span>⚔? dégâts=top deck</span><span>↺◆ relance mana</span><span>↓? défausse aléatoire</span>
          </div>
          <div className="data-entry-export-bar">
            <button className="primary-button" onClick={() => { download(generateActionsTs(cardDrafts), 'actions.ts'); setExportedActions(true); setTimeout(() => setExportedActions(false), 2000); }} type="button">
              {exportedActions ? '✓ Téléchargé !' : 'Exporter actions.ts'}
            </button>
            <button className="secondary-button" onClick={() => { if (confirm('Effacer toutes les données niv.2 ?')) setCardDrafts({}); }} type="button">Tout effacer</button>
          </div>
          <h3 className="data-entry-group-title">Actions de base</h3>
          <div className="data-entry-list">
            {baseActions.filter(c => c.kind === 'action').map(card => (
              <CardDraftRow card={card} draft={cardDrafts[card.id] ?? emptyCardDraft()} key={card.id} onChange={d => setCardDrafts(p => ({ ...p, [card.id]: d }))} />
            ))}
          </div>
          <h3 className="data-entry-group-title">Actions avancées</h3>
          <div className="data-entry-list">
            {baseActions.filter(c => c.kind === 'advanced-action').map(card => (
              <CardDraftRow card={card} draft={cardDrafts[card.id] ?? emptyCardDraft()} key={card.id} onChange={d => setCardDrafts(p => ({ ...p, [card.id]: d }))} />
            ))}
          </div>
        </>
      )}

      {tab === 'enemies' && (
        <>
          <div className="data-entry-legend">
            <span>Laissez un champ vide pour conserver la valeur placeholder actuelle.</span>
          </div>
          <div className="data-entry-export-bar">
            <button className="primary-button" onClick={() => { download(generateEnemiesTs(enemyDrafts), 'enemies.ts'); setExportedEnemies(true); setTimeout(() => setExportedEnemies(false), 2000); }} type="button">
              {exportedEnemies ? '✓ Téléchargé !' : 'Exporter enemies.ts'}
            </button>
            <button className="secondary-button" onClick={() => { if (confirm('Effacer toutes les données ennemis ?')) setEnemyDrafts({}); }} type="button">Tout effacer</button>
          </div>
          <div className="data-entry-list">
            {baseEnemies.map(enemy => (
              <EnemyDraftRow enemy={enemy} draft={enemyDrafts[enemy.id] ?? emptyEnemyDraft()} key={enemy.id} onChange={d => setEnemyDrafts(p => ({ ...p, [enemy.id]: d }))} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
