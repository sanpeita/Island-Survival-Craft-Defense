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

## Development Policy

### Map Generation (Catan-style tiles)

1. **Central base tile is fixed.** The player base tile is always the world origin (tile (0,0); safehouse `(0,-4.5)`, fabricator `(0,-5.2)`, spawn `(0,-3.2)`). It is always biome **plains** and is **excluded from the random biome pool**.
2. **World is pre-generated per "New Game" (さいしょから).** Catan-style: a fixed number of tiles per biome type guarantees resource availability by construction. POI biomes (ruined city / ruined village) use a low count = rare. Map is finite, surrounded by ocean. Tile shape = **square** (AABB collision / fog mapping stay valid).
3. **Biomes:** plains, desert, forest, coast, snowfield, ruined city, ruined village.
4. **Camp nodes are hand-authored invariants.** Nodes directly around the base tile stay fixed so the day-1 core loop (gather wood → build turret → survive the night) always works. Fixed tile counts alone do NOT guarantee spawn-reachability.

### Save Compatibility (旧データ破棄方針)

1. Structural changes **bump `STORAGE_KEY`** (currently `island_survival_save_v2` in `gameLogic.ts`). Old keys are detected and deleted (localStorage cleanup).
2. On load, a version mismatch routes to the TitleScreen "セーブデータがありません" state — never crash, never start silently with an empty world.
3. Cheap additive migrations (default-fill missing fields) still apply for minor changes; a hard break is reserved for structural changes only.

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
