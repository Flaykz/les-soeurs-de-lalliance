# Roadmap MVP

Ce document sert de plan de travail pour rendre la boite de base jouable numériquement. Il complète `docs/PROJECT_CONTEXT.md`, qui reste le contexte produit global.

## Priorite actuelle

Atteindre une partie complete jouable de bout en bout avec les donnees reelles deja saisies. Le gros reste a faire n'est plus la saisie des donnees, mais l'application complete de ces donnees par le moteur de regles : effets speciaux de cartes non modelises, puis combat boss.

Etat du code au 2026-05-24 : module `health.ts` extrait, systeme d'animation configurable avec overlays UI en place. Les valeurs `?` ennemies sont tirées aléatoirement au début du combat. La fonction morte `resolveTrapLevel` a été supprimée. Les cinq mots-clés ennemis (Caché, Hâte, Coriace, Rage, Force Brutale) sont implémentés dans le moteur et affichés dans l'UI. Le fichier `docs/RULES_FR.md` a été mis à jour avec les définitions officielles de tous les mots-clés (carte Keywords.pdf). Les mots-clés boss Gardiens et Brûlures ne sont pas encore implémentés (attente phase 6 — combat boss). Le combat boss reste une victoire prototype.

## Point de regles - officiel vs implementation actuelle

Ce point sert a garder une vision claire de ce qui est deja conforme, de ce qui est volontairement simplifie pour le MVP, et de ce qui reste a faire.

### 1. Setup et structure de partie

Regles officielles ciblees : choisir un des 4 boss, utiliser son nombre de tours normales, puis placer sa tour speciale au sommet. La case boss ne doit exister que dans la tour speciale.

Implementation actuelle : choix du boss fait, 4 boss saisis avec attaque, mot-cle, jauge, `x2`, nombre de tours normales et tour speciale associee. La sequence `N tours normales + tour boss` est generee, la pile est affichee, la sequence et la progression sont sauvegardees, et la transition vers la tour suivante se fait automatiquement quand la rangee du haut est atteinte.

Reste a faire : utiliser effectivement les jauges boss dans un vrai combat boss, tirer les `?`, gerer `x2`, appliquer les mots-cles boss, puis remplacer la victoire prototype.

Priorite : P0, car c'est le squelette de la partie complete.

### 2. Exploration et mouvement

Regles officielles ciblees : lancer deux des, choisir un resultat, se deplacer exactement de cette valeur si possible, mouvement gauche/droite/haut uniquement, jamais vers le bas. Chaque etage se resout avec trois sequences `mouvement + resolution des cases traversees`.

Implementation actuelle : deux des lances, destinations exactes calculees automatiquement, chemins multiples proposes avec preview, de choisi deduit depuis la destination, pas de mouvement vers le bas, pas de retour sur case deja resolue, absence de destination exacte geree par relance, et transition vers la tour suivante apres 3 sequences completes `deplacement + resolution des cases traversees`.

Reste a faire : valider avec le livret si la relance automatique en cas d'absence de destination exacte est bien le bon comportement, et corriger les eventuelles divergences de layouts si elles sont detectees en test.

Priorite : P1. Le mouvement est deja jouable, mais les details officiels peuvent changer le rythme de partie.

### 3. Resolution des cases traversees

Regles officielles ciblees : resoudre les cases traversees en priorite piege, combat, tresor, boss.

Table officielle des tresors :

- 1 : recuperer une carte au choix dans le deck action.
- 2 : recuperer une carte au choix dans la defausse du deck action.
- 3 : gagner 1 XP.
- 4 : gagner 2 XP.
- 5 : gagner 1 potion de vie.
- 6 : gagner 1 potion de vie.

Table de reference des pieges :

- 1 : piege niveau 4.
- 2 : piege niveau 5.
- 3 : piege niveau 6.
- 4 : subir 1 degat.
- 5 : defausser une carte aleatoire de la main.
- 6 : defausser les 5 premieres cartes du deck action.

Regle Piège Niveau X confirmee : lancer un de et subir en degats la difference positive entre X et le resultat. Avant ce lancer, il est possible de defausser une ou plusieurs cartes de la main ; le cout en mana de chaque carte defaussee s'ajoute au resultat final.

Implementation actuelle : ordre de resolution respecte, combats mis en file avant tresors et boss, tresors et boss reportes apres les combats, table d6 des tresors implementee avec choix manuel pour les resultats 1 et 2, table d6 des pieges implementee, et pieges de niveau resolus avec defausse optionnelle prealable de cartes pour ajouter leur cout en mana au jet de protection.

Reste a faire : distinguer plus clairement tresor normal et tresor avance dans l'UI, clarifier le journal de resolution, et verifier les cas limites deck/defausse/main pleine pendant les tresors en playtest.

Priorite : P1. Cette couche doit etre stabilisee avant les donnees finales.

### 4. Combat normal

Regles officielles ciblees : combat alterne phase joueur et phase ennemie, mana lancee une fois par round avec le de noir et non conservee, cartes jouees selon leurs couts et effets, defense/soins/effets temporaires appliques, recompenses exactes a la victoire.

Implementation actuelle : ennemis tires aleatoirement, groupes de 3 maximum, valeurs `?` tirees au lancer de combat, mana lancee une fois par round, cible choisie manuellement, combat sequentiel avec phases explicites `roll-mana`, `player`, `enemy` et `haste` (pour la Hâte au round 1), cartes action modelisees par effets cumulables (`damage`, `damage-top-deck`, `self-damage`, `defense`, `heal`, `draw`, `mana`, `reroll-mana`, `discard-random`), defense temporaire de round, round suivi, XP immediate par piste, sans repioche automatique, achat d'une carte visible pour 1 mana, recyclage automatique de la defausse, defausse volontaire pour +1 mana. Les cinq mots-cles ennemis sont implementes : **Caché** (ciblage bloque tant qu'un non-Caché est vivant), **Hâte** (attaque immediate apres mana round 1, mana reducible, absent de la phase ennemie du round 1), **Coriace** (resurection avec 1 PV +1 ATQ, XP a la 2e mort), **Rage** (ATQ doublee si defense = 0), **Force Brutale** (defausse aleatoire a chaque degat inflige).

Reste a faire : implementer les effets speciaux de cartes encore representes seulement dans le texte (relance de de ennemi, annulation de mot-cle, retrait d'un ennemi avec mot-cle), verifier les recompenses exactes et consolider les cas limites de pioche/defausse/main. Les mots-cles boss (Gardiens, Brulures) attendent la phase 6.

Priorite : P0. Sans combat fiable, la partie complete et le boss ne peuvent pas etre valides.

### 5. Boss et fin de partie

Regles officielles ciblees : atteindre la case boss declenche un combat boss. Le boss a une jauge de 6 des, les `?` sont tires au debut du combat, `x2` demande deux jauges completes, une attaque ne peut retirer qu'un seul de si sa valeur est suffisante, la victoire arrive seulement quand le boss est vaincu.

Implementation actuelle : les boss ont les champs `healthDice`, `healthGaugeRepeats`, `attack`, `keyword`, `normalTowerCount`, `bossTowerId` et leurs tours speciales. En revanche, atteindre la case boss declenche encore une victoire prototype.

Reste a faire : ajouter un etat de combat boss, initialiser la jauge effective avec les `?`, gerer `x2`, appliquer la regle de retrait d'un seul de par attaque, afficher la jauge, appliquer attaques/mots-cles boss, declencher victoire uniquement apres defaite du boss.

Priorite : P2 pour l'instant. Le boss doit attendre que les deplacements, la resolution des cases et les combats normaux soient fiables, sinon il reposera sur une base instable.

### 6. Deck-building, XP et economie

Regles officielles ciblees : XP utilisee pour ameliorer les cartes, gagner/ameliorer des cartes AA, relancer mana, relancer des de mouvement, acheter des potions, bannir des cartes jouees.

Couts XP officiels identifies :

- 1 XP : ameliorer une carte A/AA de la main.
- 2 XP : recuperer la premiere carte d'un deck AA.
- 1 XP : relancer le de mana.
- 1 XP : relancer les deux des de deplacement.
- 3 XP : gagner une potion qui soigne +4 PV sans depasser le palier de recuperation.
- 1 XP : bannir une carte apres l'avoir jouee.

Implementation actuelle : XP existe, potions existent, deck/main/defausse existent, et les depenses XP principales sont implementees : amelioration d'une carte en main, recuperation d'une carte AA visible, relance de mana apres lancer, relance des des de deplacement apres lancer, achat de potion, et bannissement de la derniere carte jouee. L'offre AA utilise les cartes avancees saisies.

Reste a faire : affiner les fenetres legales exactes si besoin apres tests physiques, et mieux presenter les actions XP dans l'UI.

Priorite : P2. Important pour la fidelite, mais apres une boucle combat/boss fiable.

### 7. PV, defaite et recuperation

Regles officielles ciblees : PV initiaux a 39, plafonds de recuperation apres passage sous 30, 20 et 10, defaite quand les PV tombent a 0.

Implementation actuelle : PV initiaux a 39, defaite a 0, les passages sous 30/20/10 abaissent le plafond de recuperation a 29/19/9, et potions comme soins de cartes respectent ce plafond.

Reste a faire : verifier en playtest toutes les sources de soin/degats et exposer le plafond plus clairement dans l'UI si necessaire.

Priorite : P1. Necessaire pour eviter une difficulte faussee.

### 8. Donnees boite de base

Regles officielles ciblees : utiliser les vraies cartes action, ennemis, boss, tours, pieges, tresors et textes de regles de la boite de base.

Implementation actuelle : donnees reelles principales saisies pour les cartes action de depart, cartes action avancees, ennemis, boss, tours normales, tours speciales, pieges, pieges avances, tresors et tresors avances. Les donnees restent typees et separees de l'UI.

Reste a faire : corriger les quelques textes/noms encore incertains ou illisibles si besoin, ajouter des notes sur les valeurs douteuses, et surtout aligner le moteur sur les donnees deja saisies (`?`, traits/mots-cles, effets speciaux).

Priorite : P1 pour la validation des effets qui influencent le moteur, P2 pour le nettoyage des noms/textes non bloquants.

### Priorisation globale recommandee

1. P0 - Stabiliser le combat normal avec les donnees reelles : valeurs ennemies `?`, traits/mots-cles ennemis, effets speciaux A/AA et cas limites de fin de combat.
2. P0 - Finaliser les cas limites des cases piege/tresor et clarifier le journal de resolution.
3. P1 - Remplacer la victoire prototype par un combat boss avec jauge de des, `?`, `x2`, attaque et mot-cle boss.
4. P1 - Valider en playtest les cas exacts de mouvement sans destination, les plafonds de recuperation PV et les fenetres legales des depenses XP.
5. P2 - Nettoyer les noms/textes encore illisibles, ajouter notes de doute, renforcer sauvegarde, migrations et ergonomie de debug.

## Phase 0 - Socle technique

Statut : fait

- [x] Initialiser l'app Vite React TypeScript.
- [x] Configurer PWA et build GitHub Pages.
- [x] Separer les donnees de jeu du code UI.
- [x] Ajouter types de base, donnees placeholders et helpers de regles.
- [x] Ajouter sauvegarde/reprise locale via `localStorage`.
- [x] Extraire la logique de sante dans `src/game/health.ts` (`getHealthRecoveryLimit`, `applyDamageToHealth`, `recoverHealth`).

Validation : `npm run build` passe et une partie peut etre lancee dans le navigateur.

## Phase 0.5 - Mise en place de partie

Statut : en cours avance

- [x] Transcrire les 4 boss de la boite de base.
- [x] Pour chaque boss, saisir son nom, attaque, mot-cle, jauge de sante, nombre de tours normales et tour speciale.
- [x] Modeliser la jauge de sante boss comme exactement 6 valeurs, chacune entre 1 et 6 ou `?`.
- [x] Modeliser l'icone boss `x2` comme deux jauges de sante completes a vaincre.
- [ ] Tirer aleatoirement les valeurs `?` de la jauge au debut du combat boss.
- [ ] Pour un boss `x2`, reinitialiser la jauge apres la premiere jauge vaincue et retirer les `?` avant la seconde.
- [x] Ajouter au modele boss la donnee qui determine le nombre de tours normales a parcourir avant le boss.
- [x] Associer chaque boss a une tour speciale de boss avec les memes donnees qu'une tour normale.
- [x] Remplacer le demarrage direct par un ecran de setup.
- [x] Permettre au joueur de choisir le boss au debut de la partie.
- [x] Initialiser la partie avec le boss choisi.
- [x] Generer/tirer la sequence de tours normales necessaire selon le boss choisi.
- [x] Ajouter la tour speciale du boss au-dessus des tours normales.
- [x] Garder le boss choisi, le nombre total de tours, et la progression de tour dans la sauvegarde.
- [x] Ne faire apparaitre/resoudre la case boss que dans la tour speciale du boss.
- [ ] Declencher le combat boss quand la joueuse atteint la case boss en haut au milieu de la tour speciale.

Validation : une nouvelle partie commence par le choix d'un des 4 boss, puis l'app affiche une pile composee des tours normales tirees aleatoirement et de la tour speciale du boss au sommet.

## Phase 1 - Exploration de la tour

Statut : en cours avance

- [x] Modeliser des tours `5x8`.
- [x] Tirer une tour au hasard au debut d'une partie.
- [x] Garder la tour tiree dans la sauvegarde.
- [x] Afficher une grille de tour lisible.
- [x] Lancer deux des de deplacement.
- [x] Surligner directement toutes les destinations atteignables par l'un des deux des.
- [x] Deduire automatiquement le de utilise depuis la destination choisie.
- [x] Interdire le deplacement vers le bas.
- [x] Interdire de revenir sur une case deja visitee.
- [x] Gerer plusieurs chemins vers une meme destination avec selection, previsualisation et confirmation.
- [x] Afficher les chemins sous forme de recap cumule par icones.
- [ ] Confirmer les details exacts des regles de mouvement avec le livret, notamment les cas ou aucun deplacement exact n'est possible.
- [x] Remplacer les layouts placeholders par les layouts/setup reels de la boite de base.
- [x] Ajouter plusieurs tours normales saisies pour tester des parties plus longues.
- [x] Adapter la progression pour enchainer plusieurs tours avant le boss selon le setup.
- [x] Afficher les tours empilees verticalement, par exemple 2 tours normales puis la tour speciale boss au-dessus.

Validation : apres un lancer de des, seules les cases legalement atteignables sont cliquables, et le chemin choisi correspond aux cases effectivement resolues.

## Phase 2 - Resolution des cases traversees

Statut : en cours avance

- [x] Modeliser les types de case : vide, piege, ennemi, tresor, boss.
- [x] Modeliser les cases ennemi par nombre d'ennemis (`enemyCount`) plutot que par ennemi nomme.
- [x] Resoudre les cases traversees par priorite : pieges, combats, tresors, boss.
- [x] Reporter les tresors et le boss tant que les combats issus du mouvement ne sont pas termines.
- [x] Remplacer l'effet placeholder des pieges par la table d6 de reference.
- [x] Implementer la regle de base des pieges niveau X : deuxieme lancer de de et degats sur difference positive.
- [x] Ajouter la defausse optionnelle de cartes avant le lancer d'un piege niveau X pour augmenter le resultat avec leur cout en mana.
- [x] Remplacer l'effet placeholder des tresors par la table d6 officielle.
- [x] Ajouter le choix manuel de carte pour les resultats tresor 1 et 2.
- [x] Saisir et implementer les tables de tresor avance et piege avance.
- [x] Remplacer les recuperations automatiques des tresors avances 1 et 2 par un choix joueur quand plusieurs cartes sont recuperables.
- [ ] Distinguer clairement les tables de tresor normal et tresor avance dans l'UI et les references.
- [x] Resoudre le boss uniquement quand la destination finale est la case boss de la tour speciale boss.
- [ ] Ajouter un journal plus clair des files de resolution quand un mouvement traverse beaucoup de cases.

Validation : pour un chemin contenant piege, tresor et plusieurs ennemis, le jeu resout toujours piege puis combats puis tresor puis boss.

## Phase 3 - Combat minimal fiable

Statut : en cours avance

- [x] Tirer aleatoirement les ennemis depuis `baseEnemies` au moment de la resolution.
- [x] Decouper les ennemis en groupes de 3 maximum par combat.
- [x] Afficher plusieurs ennemis dans un combat.
- [x] Attaquer une cible ennemie simplifiee.
- [x] Faire attaquer le groupe ennemi.
- [x] Permettre de choisir la cible attaquee.
- [x] Implementer la vraie sequence de round : lancer mana, phase joueur, phase ennemie, fin de round.
- [x] Tirer et appliquer les valeurs ennemies `?` pour l'attaque et les PV (`resolvedAttack` stocke le jet dans `CombatEnemy`, affiché dans la carte ennemi pendant le combat).
- [x] Gerer les traits/mots-cles ennemis (`Caché`, `Coriace`, `Hâte`, `Rage`, `Force Brutale`) — implémentés dans `combat.ts` et affichés dans l'UI. Mots-clés boss (`Gardiens`, `Brûlures`) reportés à la phase 6.
- [ ] Implementer les effets speciaux de cartes encore representes seulement dans le texte : relance de de ennemi, annulation de mot-cle, retrait d'un ennemi avec mot-cle.
- [ ] Verifier les effets temporaires avec les vraies cartes.
- [x] Supprimer la fonction privee morte `resolveTrapLevel` dans `cells.ts` (supplantee par `resolveTrapLevelWithBonus`).
- [x] Gerer les recompenses XP immediates selon la piste de round de chaque ennemi.
- [x] Gerer defaite et limites de recuperation de PV selon les paliers 30/20/10.

Validation : un combat contre 1 a 3 ennemis peut etre resolu sans bloquer la partie, avec des transitions claires vers le prochain combat ou la suite de resolution.

## Phase 4 - Donnees de la boite de base

Statut : donnees principales saisies, validation restante

- [x] Transcrire les cartes action de depart.
- [x] Transcrire les cartes action avancee.
- [x] Transcrire les ennemis.
- [x] Transcrire les boss.
- [x] Saisir pour chaque boss son attaque, son mot-cle et sa jauge de sante de 6 des.
- [x] Saisir si le boss possede l'icone `x2`.
- [x] Utiliser `?` dans la jauge quand un de doit etre tire aleatoirement au debut du combat boss.
- [x] Saisir pour chaque boss le nombre de tours/floors requis avant l'affrontement.
- [x] Saisir pour chaque boss sa tour speciale, incluant ennemis, tresors, pieges, cases vides et case boss en haut au milieu.
- [x] Transcrire pieges, pieges avances, tresors, tresors avances et toute donnee de tour necessaire.
- [x] Remplacer les valeurs placeholders principales par les valeurs reelles.
- [ ] Ajouter des notes de doute quand une valeur doit etre verifiee.
- [ ] Nettoyer les noms/textes encore illisibles ou incomplets si besoin.
- [x] Ajouter un paquet de donnees complet pour tester le MVP : 8 tours normales, 4 tours boss, 18 ennemis, 16 cartes action et 8 cartes avancees A1 achetables avec XP.
- [ ] Verifier les divergences entre `text` et effets structures, par exemple les cartes dont le texte decrit un effet special non encore modelise.

Validation : les fichiers `src/data/*.ts` representent la boite de base avec des valeurs explicites ou `null` documente.

## Phase 5 - Deck-building et depenses XP

Statut : en cours avance

- [x] Modeliser la boucle minimale deck/main/defausse : pas de repioche automatique, cartes jouees en defausse, achat action visible pour 1 mana, defausse remelangee automatiquement quand le deck action est vide.
- [x] Differencier clairement les cartes A et AA dans les donnees de cartes.
- [x] Implementer amelioration d'une carte A/AA de la main pour 1 XP.
- [x] Implementer recuperation d'une carte AA visible pour 2 XP.
- [x] Afficher une offre de cartes A1 achetables avec XP depuis les donnees placeholders.
- [x] Implementer relance de mana pour 1 XP.
- [x] Implementer relance des deux des de deplacement pour 1 XP.
- [x] Implementer achat d'une potion pour 3 XP.
- [x] Corriger l'utilisation des potions : +4 PV sans depasser le palier de recuperation.
- [x] Implementer la defausse volontaire d'une carte de la main pour gagner +1 mana ce round, plafonnee a 6 mana.
- [x] Implementer bannissement d'une carte pour 1 XP apres l'avoir jouee.
- [ ] Verifier les fenetres legales exactes de chaque depense XP avec le livret et les tests physiques.
- [ ] Ameliorer la presentation des actions XP disponibles selon le contexte.

Validation : apres un combat ou une phase autorisee, le joueur peut depenser son XP sur les options legales.

## Phase 6 - Boss et fin de partie

Statut : a faire

- [ ] Modeliser les PV boss sous forme de des.
- [ ] Resoudre les `?` de la jauge boss en valeurs 1-6 au demarrage du combat boss.
- [ ] Si le boss a `x2`, faire recommencer une nouvelle jauge complete apres la premiere jauge vaincue.
- [ ] Appliquer la regle : une attaque ne peut retirer qu'un seul de de boss.
- [ ] Verifier la valeur minimale d'attaque necessaire pour retirer un de.
- [ ] Implementer mots-cles et effets boss.
- [ ] Declencher victoire uniquement quand le boss est vaincu.

Validation : atteindre le boss ne suffit plus a gagner ; il faut le combattre et appliquer ses regles propres.

## Phase 7 - Sauvegarde robuste et ergonomie

Statut : en cours partiel

- [ ] Versionner `GameState`.
- [ ] Ajouter migrations ou reset propre quand le format change.
- [ ] Ajouter un bouton explicite Continuer/Reprendre.
- [ ] Ameliorer le journal d'evenements.
- [ ] Ajouter controles utiles pour debug MVP : nouvelle tour, vider sauvegarde, afficher etat brut si besoin.
- [x] Systeme d'animation configurable : vitesse rapide/normale/lente, persistee dans `localStorage` (`lsa-animation-speed`).
- [x] Animation step-by-step du chemin de deplacement (`movementAnim`).
- [x] Animation d'introduction de piege (`showTrapIntro`).
- [x] Overlays UI : `TowerStackOverlay`, `LogOverlay`, `DecksOverlay`, `CardInspectOverlay`.
- [x] Cartes de reference en jeu : `TrapReferenceCard`, `TreasureReferenceCard`.

Validation : une partie peut etre interrompue/reprise sans erreur, meme apres evolution controlee du modele.

## Ordre recommande des prochains travaux

1. ~~Supprimer `resolveTrapLevel` (code mort dans `cells.ts`)~~ — **fait**.
2. ~~Valeurs ennemies `?` et mots-cles ennemis~~ — **fait** (Caché, Hâte, Coriace, Rage, Force Brutale implementes ; `docs/RULES_FR.md` mis a jour avec tous les mots-cles officiels).
3. Implementer les effets speciaux de cartes encore en texte libre : relance de de ennemi, annulation de mot-cle, retrait d'un ennemi avec mot-cle. Verifier les recompenses exactes et les cas limites pioche/defausse/main en playtest.
4. Stabiliser la phase 2 : journal de resolution plus clair, distinction tresor normal/avance dans l'UI, cas limites deck/defausse vides pendant les tresors.
5. Remplacer la victoire boss prototype par un vrai combat boss : jauge de des, `?`, `x2`, attaque, mots-cles Gardiens et Brulures.
6. Valider en playtest les cas sans mouvement exact, les plafonds de recuperation PV et les fenetres legales des depenses XP.
7. Nettoyer les noms/textes incertains et ajouter les notes de doute restantes dans les donnees.
8. Versionner `GameState` et ajouter reset/migrations propres (phase 7).

## Definition du MVP jouable

Le MVP jouable est atteint quand :

- Une partie peut etre lancee, interrompue et reprise.
- Une partie commence par le choix d'un des 4 boss de la boite de base.
- Le boss choisi determine correctement la duree de progression avant le boss.
- La zone de jeu affiche la pile complete : tours normales puis tour speciale boss au sommet.
- La tour est parcourue avec les vraies contraintes de mouvement.
- Les cases traversees se resolvent dans le bon ordre.
- Les combats normaux et le boss peuvent etre termines avec les cartes disponibles.
- Les donnees de la boite de base sont assez completes pour jouer sans inventer de valeurs pendant la partie.
- La victoire et la defaite sont gerees clairement.
