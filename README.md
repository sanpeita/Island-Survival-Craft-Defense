# GeminiGames / Island Survival Craft Defense

Offline mobile 3D island survival game. React 19 + Three.js (WebGL) + Tailwind 4, built with Vite. No backend at runtime. Deployed to GitHub Pages from `main`.

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

---

See `AGENTS.md` for commands, architecture, and gotchas.