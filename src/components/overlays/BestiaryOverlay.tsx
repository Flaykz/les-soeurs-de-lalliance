import { useState } from 'react';
import { baseActions, baseEnemies, towerDefinitions } from '../../data/baseSet';
import { FlippableCardTile, TowerList } from '../CardCatalog';
import { DataEntryPanel } from '../DataEntryPanel';
import { EnemyCardDisplay } from '../EnemyCard';
import { TrapReferenceCard } from '../TrapReferenceCard';
import { TreasureReferenceCard } from '../TreasureReferenceCard';

type Tab = 'actions' | 'advanced' | 'enemies' | 'towers' | 'reference';

const TABS: { id: Tab; label: string }[] = [
  { id: 'actions', label: 'Actions' },
  { id: 'advanced', label: 'Avancées' },
  { id: 'enemies', label: 'Ennemis' },
  { id: 'towers', label: 'Tours' },
  { id: 'reference', label: 'Référence' },
];

interface Props {
  onClose: () => void;
}

export function BestiaryOverlay({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('actions');
  const [showDataEntry, setShowDataEntry] = useState(false);
  const baseActionCards = baseActions.filter((card) => card.kind === 'action');
  const advancedActionCards = baseActions.filter((card) => card.kind === 'advanced-action');
  const normalTowers = towerDefinitions.filter((tower) => !tower.id.startsWith('boss-tower-'));

  return (
    <section className="overlay-panel" aria-label="Bestiaire">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="overlay-card wide-overlay bestiary-overlay">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Référence</p>
            <h2>Bestiaire</h2>
          </div>
          <button className="secondary-button" onClick={onClose}>Fermer</button>
        </div>

        <nav className="bestiary-tabs" aria-label="Catégories">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`bestiary-tab${activeTab === tab.id ? ' bestiary-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="bestiary-tab-content">
          {activeTab === 'actions' && (
            <section className="panel">
              <p className="eyebrow">Cartes de base</p>
              <h2>Actions de base</h2>
              <div className="setup-card-grid">
                {baseActionCards.map((card) => <FlippableCardTile card={card} key={card.id} />)}
              </div>
            </section>
          )}

          {activeTab === 'advanced' && (
            <section className="panel">
              <div className="bestiary-advanced-header">
                <div>
                  <p className="eyebrow">Cartes achetables</p>
                  <h2>Actions avancées</h2>
                </div>
                <button
                  className={showDataEntry ? 'primary-button' : 'secondary-button'}
                  onClick={() => setShowDataEntry(v => !v)}
                  type="button"
                >
                  {showDataEntry ? '✕ Fermer saisie' : '✎ Saisir niv.2'}
                </button>
              </div>
              {showDataEntry && <DataEntryPanel />}
              <div className="setup-card-grid">
                {advancedActionCards.map((card) => <FlippableCardTile card={card} key={card.id} />)}
              </div>
            </section>
          )}

          {activeTab === 'enemies' && (
            <section className="panel">
              <p className="eyebrow">Paquet ennemi</p>
              <h2>Ennemis</h2>
              <div className="setup-enemy-grid">
                {baseEnemies.map((enemy) => (
                  <EnemyCardDisplay card={enemy} key={enemy.id} />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'towers' && (
            <TowerList title="Tours normales" towers={normalTowers} />
          )}

          {activeTab === 'reference' && (
            <section className="panel">
              <p className="eyebrow">Cartes de référence</p>
              <h2>Pièges &amp; Trésors</h2>
              <div className="setup-reference-grid">
                <div>
                  <p className="eyebrow">Piège</p>
                  <TrapReferenceCard />
                </div>
                <div>
                  <p className="eyebrow">Piège avancé</p>
                  <TrapReferenceCard advanced />
                </div>
                <div>
                  <p className="eyebrow">Trésor</p>
                  <TreasureReferenceCard />
                </div>
                <div>
                  <p className="eyebrow">Trésor avancé</p>
                  <TreasureReferenceCard advanced />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
