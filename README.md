# Les Soeurs de l'Alliance Digital

MVP web statique de la boite de base, conçu pour GitHub Pages et jouable hors ligne en PWA.

## Objectif MVP

- Boite de base uniquement.
- Cartes textuelles, sans scan ni design final.
- Priorite au moteur de regles et a une interface jouable.
- Donnees de jeu separees de l'UI pour pouvoir saisir les cartes progressivement.

## Commandes

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit l'application et publie `dist/` sur GitHub Pages a chaque push sur `main`.

Dans GitHub, regler `Settings > Pages > Source` sur `GitHub Actions`.

## PWA

Le service worker est genere au build par `vite-plugin-pwa`. Apres installation depuis le navigateur, l'app peut etre lancee hors ligne.

## Contexte projet et agents

Les instructions persistantes pour les agents sont dans `AGENTS.md`.

`CLAUDE.md` renvoie vers `AGENTS.md` pour eviter de dupliquer les consignes.

Au debut d'une nouvelle session, lire dans cet ordre :

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `graphify-out/GRAPH_REPORT.md`, si present

`docs/PROJECT_CONTEXT.md` contient le contexte produit, les decisions prises, le scope actuel et le resume des regles utiles au MVP.

## Graphify

Le projet utilise Graphify pour conserver un graphe de connaissance du code et du contexte projet.

Commandes utiles :

```bash
graphify query "<question>"
graphify path "<node A>" "<node B>"
graphify explain "<node>"
graphify update .
```

Apres des changements significatifs de code ou de documentation, lancer :

```bash
graphify update .
```

Pour une extraction semantique plus riche des documents Markdown, configurer une cle LLM puis lancer :

```bash
graphify extract . --out .
```
