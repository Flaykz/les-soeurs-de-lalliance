# Project Context

## Goal

Create a digital MVP for the base box of `Les Soeurs de l'Alliance` by Alone Editions.

The project intentionally starts with a functional prototype rather than a polished visual adaptation. The first objective is to make the game playable digitally, then improve presentation later.

## Current Scope

- Implement the base box only.
- Ignore the two expansions for now.
- Do not scan or reproduce card artwork during the MVP phase.
- Represent cards as simple text-based UI components containing only gameplay-relevant information.

## Product Direction

- Target platform: static web app.
- Hosting target: GitHub Pages.
- Offline target: installable PWA playable without network access.
- No backend for the MVP.
- Prefer local browser state and data files over server-side persistence.

## Technical Stack

- Vite
- React
- TypeScript
- `vite-plugin-pwa`
- GitHub Actions for deployment to GitHub Pages

## Important Decisions

- Keep game data separate from the UI.
- Use typed data structures for cards, bosses, and game state.
- Make the app data-driven so that card values can be entered or corrected progressively.
- Start with placeholder card data until the physical cards are transcribed.
- Prioritize the rules engine over visual fidelity.
- Keep the UI simple and readable on mobile and desktop.

## Rules Source

The public French rulebook was found via BoardGamesFlix:

`https://d3uixa1v7930vx.cloudfront.net/Les_Soeurs_de_l_Alliance_Regles_FR_773e1eaff0.pdf`

A local Markdown conversion is stored at `docs/RULES_FR.md` so Graphify and future agents can query the rulebook without re-fetching the PDF.

Key rulebook summary:

- Solo deck-building dungeon crawler.
- The base box has 4 bosses.
- Game setup starts with choosing a boss.
- The chosen boss determines how many normal towers/floors must be completed before encountering the boss.
- The boss encounter is represented as a special boss tower, with the same kind of cell data as a normal tower and a boss icon/cell at the top middle.
- Each boss has a name, attack value, keyword, health gauge, normal tower count, and special boss tower.
- A boss health gauge has exactly 6 dice values. Each value is 1-6 or `?`; `?` means that die value is rolled randomly when the boss fight starts.
- Some bosses have an `x2` icon. This means the full 6-die health gauge must be defeated twice; after the first gauge is defeated, the gauge is reset and any `?` values are rolled again.
- Example: if the selected boss requires 2 towers, the app should stack 2 random normal towers, then the special boss tower above them.
- Reaching the boss cell in the boss tower triggers the boss combat.
- The player climbs a tower floor by floor.
- Each floor is resolved through three `movement + crossed cell resolution` sequences.
- Movement uses two dice; the player chooses one result and must move exactly that many cells if possible.
- Movement can go left, right, or up, but never down.
- Crossed cells resolve in priority order: trap, combat, treasure, boss.
- Trap resolution rolls 1d6: 1 triggers a level 4 trap, 2 triggers level 5, 3 triggers level 6, 4 deals 1 damage, 5 discards one random card from hand, 6 discards the first 5 cards from the action deck. For a level X trap, roll another die and suffer damage equal to the positive difference between X and the die result; before rolling, cards may be discarded from hand to add their mana cost to that result. Current implementation supports this pre-roll discard choice for standard and advanced level traps.
- Normal treasure resolution rolls 1d6: 1 recovers one chosen card from the action deck then shuffles it, 2 recovers one chosen card from the action discard, 3 gives 1 XP, 4 gives 2 XP, and 5-6 gives one life potion. Advanced treasure uses the stronger table with 2/3 XP and 1/2 potions.
- Combat alternates player phase and enemy phase.
- Mana is rolled each round with the black die and is not kept between rounds.
- XP can be spent as follows: 1 XP to improve an A card, 2 XP to gain/improve an AA card, 1 XP to reroll the mana die, 1 XP to reroll both movement dice, 3 XP to gain a potion that heals +4 PV without exceeding the current recovery ceiling, and 1 XP to banish a card after playing it.
- Health starts at 39 and has implemented recovery ceilings after dropping below 30, 20, and 10: recovery is capped at 29, 19, then 9.
- Boss health is represented by multiple dice; each attack can remove one die only if the attack value is at least equal to that die.
- Victory is achieved by defeating the boss.

## Current Implementation State

- A Vite React TypeScript app has been created.
- PWA support is configured with `injectManifest` because the local project path contains an apostrophe and automatic Workbox generation failed in that path.
- GitHub Pages deployment workflow exists at `.github/workflows/deploy.yml`.
- Initial playable slice exists in `src/App.tsx`.
- Game types exist at `src/game/types.ts`.
- Base-set data is split across `src/data/actions.ts`, `src/data/enemies.ts`, `src/data/bosses.ts`, and `src/data/tower.ts`, with `src/data/baseSet.ts` re-exporting them for the app. The current data pool contains 8 normal towers, 4 boss towers, 18 enemies, and 16 action cards including 8 advanced A1 cards. Action cards use typed cumulative effects (`damage`, `damage-top-deck`, `self-damage`, `defense`, `heal`, `draw`, `mana`, `reroll-mana`, `discard-random`) where the engine currently supports them.
- Minimal pure rules helpers exist at `src/game/rules.ts`.
- The app can start a new game after choosing one of the 4 available boss entries, generate a sequence with the boss-defined number of normal towers followed by that boss special tower, shuffle a 16-card action deck, reveal its top card, split shuffled advanced actions into two visible offer decks, draw a 5-card starting hand, save it in `localStorage`, restore it after reload, display the current tower with an optional full-tower planning view, roll movement dice, highlight exact reachable destinations from both dice on the active tower grid, deduce the chosen die from the clicked destination, let the player preview and confirm a path when several valid paths reach the same destination, resolve crossed cells by priority (`trap`, then combats, then treasures, then boss if the destination is boss), resolve normal and advanced treasures with player card choice where applicable, run simplified multi-enemy combats in groups of up to 3 randomly drawn enemies, track combat rounds with explicit phases (`roll-mana`, `player`, `enemy`), temporary defense, cumulative action effects, action-card purchase for 1 mana during the player phase, discard-to-mana during the player phase with mana capped at 6, no automatic hand refill after rounds or combats, action discard reshuffling when the action deck is empty, enemy XP by kill round using variable-length XP tracks, recovery ceilings at 29/19/9 after health drops below 30/20/10, and XP spending for card upgrades, AA recovery, mana reroll, movement reroll, potion purchase, and banishing the last played card. It can use potions for +4 PV capped by the recovery ceiling, advance from one tower to the next after 3 completed `movement + crossed cell resolution` sequences, and reach a prototype victory state.
- Boss selection, boss-dependent normal tower sequence, special boss tower placement, and stacked multi-tower display are implemented at setup. Real boss combat is not implemented yet; current boss resolution still triggers prototype victory.
- Recent rules alignment: normal and advanced treasures use their distinct tables, advanced treasure card recovery uses player choice where applicable, level traps from advanced traps allow the same pre-roll discard bonus as standard level traps, potions heal +4 PV, and recovery is capped at 29/19/9 after health drops below 30/20/10.
- Movement now uses grid coordinates and only allows left, right, and upward steps; downward movement is not allowed.
- Remaining incompleteness is mostly in rule execution rather than data entry: enemy `?` values, enemy traits/keywords, special card text not covered by typed effects, boss combat, save migrations, and exact rulebook fidelity still need work.

## Next Playability Steps

Detailed task tracking lives in `docs/ROADMAP.md`. Keep this section as a short summary only.

1. Keep boss combat non-priority until movement, normal combat, and pre-boss exploration are reliable.
2. Stabilize normal combat effects further, especially enemy effects, exact rewards, draw/discard cadence, and official recovery limits.
3. Replace simplified trap and treasure effects with official effects.
4. Refine XP-spending UX and legal timing after playtests.
5. Validate transcribed base-box data during playtests and add notes for any uncertain values or unsupported special effects.
6. Add boss combat, deck-building depth, and stronger save migration after the pre-boss loop is stable.

## Recommended Workflow For Future OpenCode Sessions

- Read this file first for product and architecture context.
- Read `graphify-out/GRAPH_REPORT.md` if Graphify has been generated.
- Use `graphify query` or inspect `graphify-out/graph.json` for relationship-oriented questions.
- Update this file when major product decisions change.
- Run `graphify . --update` after meaningful code or documentation changes.
