import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const INSTALL_KEY = 'lsa-pwa-install-dismissed';

export function PWAPrompts() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALL_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShowInstall(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') localStorage.setItem(INSTALL_KEY, '1');
    setShowInstall(false);
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_KEY, '1');
    setShowInstall(false);
  };

  return (
    <>
      {needRefresh && (
        <div className="pwa-update-banner" role="alert">
          <span className="pwa-update-text">
            <span className="pwa-update-icon">⬆</span>
            Nouvelle version disponible
          </span>
          <button
            className="pwa-update-btn"
            onClick={() => updateServiceWorker(true)}
          >
            Mettre à jour
          </button>
        </div>
      )}

      {showInstall && (
        <div className="pwa-install-sheet" role="dialog" aria-modal="true">
          <div className="pwa-install-body">
            <div className="pwa-install-icon">⚔</div>
            <div className="pwa-install-info">
              <strong>Les Soeurs de l'Alliance</strong>
              <span>v{__APP_VERSION__}</span>
              <p>Installez l'app pour jouer hors ligne, sans réseau.</p>
            </div>
          </div>
          <div className="pwa-install-actions">
            <button className="pwa-install-btn-primary" onClick={handleInstall}>
              Installer
            </button>
            <button className="pwa-install-btn-ghost" onClick={handleDismiss}>
              Plus tard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
