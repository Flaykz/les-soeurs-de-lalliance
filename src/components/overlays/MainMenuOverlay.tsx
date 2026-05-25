interface Props {
  onClose: () => void;
  onOpenBestiary: () => void;
  onOpenLog: () => void;
  onOpenTowerStack: () => void;
  onNewGame: () => void;
}

export function MainMenuOverlay({ onClose, onOpenBestiary, onOpenLog, onOpenTowerStack, onNewGame }: Props) {
  return (
    <section className="overlay-panel" aria-label="Menu principal">
      <div className="overlay-scrim" onClick={onClose} />
      <div className="main-menu-card">
        <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '8px' }}>Menu</p>
        <nav className="main-menu-nav">
          <button
            className="main-menu-item"
            onClick={() => { onClose(); onOpenTowerStack(); }}
            type="button"
          >
            <span className="main-menu-icon">▦</span>
            <span className="main-menu-label">Tours</span>
          </button>
          <button
            className="main-menu-item"
            onClick={() => { onClose(); onOpenBestiary(); }}
            type="button"
          >
            <span className="main-menu-icon">📖</span>
            <span className="main-menu-label">Bestiaire</span>
          </button>
          <button
            className="main-menu-item"
            onClick={() => { onClose(); onOpenLog(); }}
            type="button"
          >
            <span className="main-menu-icon">📜</span>
            <span className="main-menu-label">Journal</span>
          </button>
          <button
            className="main-menu-item main-menu-item--danger"
            onClick={() => { onClose(); onNewGame(); }}
            type="button"
          >
            <span className="main-menu-icon">↻</span>
            <span className="main-menu-label">Nouvelle partie</span>
          </button>
        </nav>
        <button className="secondary-button" onClick={onClose} style={{ width: '100%', marginTop: '8px' }}>
          Fermer
        </button>
      </div>
    </section>
  );
}
