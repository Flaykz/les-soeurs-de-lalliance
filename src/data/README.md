# Data Entry

Ce dossier contient les donnees de la boite de base.

Fichiers a remplir :

- `actions.ts` : cartes Action et Action avancee.
- `enemies.ts` : cartes Ennemi.
- `bosses.ts` : cartes Boss.
- `tower.ts` : definitions de tours `5x8`; une tour est tiree au hasard au demarrage d'une partie.

Regles de saisie :

- Garder des `id` stables, sans espaces ni accents, par exemple `action-attaque-l1`.
- Recopier le texte utile de la carte dans `text`.
- Mettre `null` quand une valeur n'est pas encore connue ou doit etre verifiee.
- Utiliser `notes` pour les doutes de transcription ou de regle.
- Ne pas coder les effets complexes ici : les regles les interpreteront plus tard.
- Dans `tower.ts`, ajouter une entree dans `towerDefinitions` via `createTower(...)`; seules les cases speciales sont a saisir, les autres deviennent des salles vides.
- Pour une case ennemi dans `tower.ts`, renseigner `kind: 'enemy'` et `enemyCount`; l'ennemi exact est tire au hasard au moment de la resolution du combat.
- La boite de base contient 4 boss. Chaque boss devra indiquer le nombre de tours normales a parcourir avant son affrontement.
- Chaque boss devra aussi referencer ou contenir sa tour speciale de boss, structuree comme une tour normale, avec la case boss en haut au milieu.
- Chaque boss doit avoir un nom, une attaque, un mot-cle, et une jauge de sante de 6 des.
- Dans `healthDice`, chaque entree vaut `1` a `6` ou `?`; `?` signifie que ce de est tire au hasard au debut du combat boss.
- Si un boss a l'icone `x2`, renseigner `healthGaugeRepeats: 2`; il faudra vaincre deux jauges completes, avec relance des `?` pour la seconde.

Exemple action :

```ts
{
  id: 'action-attaque-l1',
  name: 'Attaque',
  kind: 'action',
  manaCost: 1,
  level: 1,
  attack: 3,
  text: 'Inflige 3 degats a un ennemi.',
  notes: 'Valeur a confirmer si besoin.'
}
```

Exemple ennemi :

```ts
{
  id: 'enemy-garde',
  name: 'Garde',
  kind: 'enemy',
  attack: 4,
  health: 5,
  xpReward: 2,
  text: 'Texte de la carte.'
}
```
