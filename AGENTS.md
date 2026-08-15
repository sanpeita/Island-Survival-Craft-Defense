# AGENTS.md

Offline mobile 3D island survival game. React 19 + Three.js (WebGL) + Tailwind 4, built with Vite. No backend at runtime.

## Commands

- Install: `npm install` (only `bun.lock` is committed; bun is NOT installed locally — use npm)
- Dev server: `npm run dev` → http://localhost:3000 (host 0.0.0.0)
- Typecheck: `npm run lint` (= `tsc --noEmit`; there is NO eslint/prettier)
- Build: `npm run build` → `dist/`
- No test framework exists. Verify with `npm run lint` then `npm run build`.

## Architecture

- `src/App.tsx` owns a 60 FPS loop calling `updateGameWorld()`; each frame it syncs the pure `GameState` into the imperative Three.js renderer via `engine.sync*()` methods.
- `src/game/gameLogic.ts` = pure state/update logic (no DOM/three deps). `src/game/threeEngine.ts` = rendering/interaction. Keep this split.
- `src/data/*` and `src/types/game.ts` = recipes, enemy library, shared types.
- Path alias `@/*` → repo root (see tsconfig.json + vite.config.ts).

## Conventions

- Save progress to `localStorage` via `saveGame()` (auto-saves every 5s in-game). No network persistence.
- UI copy is primarily Japanese (`lang="ja"`, recipes have both `name`/`nameJa`, floating text in Japanese). Match the existing language for new strings.
- `vite.config.ts`: do not change the `hmr`/`watch` settings or the comment warning — they exist to prevent flicker when agents edit files.
- `base: './'` — all asset URLs are relative.

## Gotchas

- `@google/genai`, `express`, `dotenv` are unused leftover deps from an AI Studio template; `metadata.json` declares server-side Gemini but NO `server.js` exists. The game is fully client-side — don't build on them.
- `.env*` is gitignored; `GEMINI_API_KEY`/`APP_URL` are injected by AI Studio at runtime, irrelevant to this repo.
- `npm run clean` also removes a non-existent `server.js` (leftover).
- Push to `main` auto-deploys to GitHub Pages via `.github/workflows/deploy.yml` (runs `npm install` + `npm run build` on Node 20).
