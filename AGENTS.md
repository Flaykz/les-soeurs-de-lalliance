# Agent Instructions

## Mandatory Startup Context

At the beginning of every new agent session in this repository, read these files before proposing or making changes, but keep the read bounded:

1. `docs/PROJECT_CONTEXT.md`
2. `graphify-out/GRAPH_REPORT.md`, if it exists

Use targeted ranges, not full-file reads, unless the user explicitly asks for a full review. The goal is to recover current product direction and graph freshness without filling the context window.

Then use Graphify when a question depends on project structure, architecture, file relationships, or previous design decisions.

## Context Budget Discipline

- Treat the conversation context as a limited engineering resource.
- Prefer `graphify query`, `graphify explain`, `grep`, and small ranged reads over reading large files end-to-end.
- Do not re-read `graphify-out/GRAPH_REPORT.md` repeatedly during a session unless the graph itself is the topic or freshness must be checked.
- For local UI/style iterations, inspect only the relevant component or CSS selectors instead of rescanning `src/App.tsx` or `src/styles.css` wholesale.
- Avoid pasting or producing large diffs, reports, or command outputs in chat unless the user asks for them.
- Batch small related edits before running verification commands, instead of rebuilding after every tiny CSS adjustment.
- Keep progress messages short and only send them when they add useful information.
- When the task is narrow and the target location is known, use direct patches rather than broad exploration.

## Graphify Workflow

Use the existing graph as an index when possible instead of rescanning the entire project manually.

Useful commands:

```bash
graphify query "<question>"
graphify path "<node A>" "<node B>"
graphify explain "<node>"
```

After meaningful code changes, update the structural graph. Do not update Graphify after every micro-adjustment; wait for a stable checkpoint or the end of a coherent work batch.

```bash
graphify update .
```

If documentation, product decisions, or other non-code context changed substantially, prefer a full semantic extraction when an LLM API key is configured:

```bash
graphify extract . --out .
```

If no LLM API key is configured, `graphify update .` is still useful for code and Markdown structure, but semantic edges may be incomplete.

## Project Summary

This project is a digital MVP for the base box of `Les Soeurs de l'Alliance` by Alone Editions.

Current priorities:

- Base box only; ignore expansions for now.
- Functional MVP before visual polish.
- Text-only cards first; no card scans or final design required yet.
- Static web app hosted on GitHub Pages.
- PWA installable and playable offline.
- Data-driven game model with rules separated from UI.

Current stack:

- Vite
- React
- TypeScript
- `vite-plugin-pwa`
- GitHub Actions + GitHub Pages

## Change Discipline

- Keep changes small and iterative.
- Prefer typed data structures and pure game-rule helpers over UI-specific logic.
- Update `docs/PROJECT_CONTEXT.md` when product scope or architecture decisions change.
- Do not remove or rewrite Graphify outputs unless explicitly asked.
