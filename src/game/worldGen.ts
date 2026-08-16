import { ResourceNode } from '../types/game';

export type BiomeId =
  | 'plains'
  | 'desert'
  | 'forest'
  | 'coast'
  | 'snowfield'
  | 'ruined_city'
  | 'ruined_village';

export interface WorldTile {
  id: string;
  tx: number;
  tz: number;
  biome: BiomeId;
  isBase: boolean;
  centerX: number;
  centerZ: number;
  halfSize: number;
}

export interface WorldGeneration {
  tiles: WorldTile[];
  nodes: ResourceNode[];
}

// --- World constants (Catan-style: finite map, base chunk at origin, ocean beyond ring) ---
export const BASE_CHUNK_HALF = 14; // Base chunk = the current fixed island (plains, excluded from biome pool)
export const RING_TILE_HALF = 6; // Ring tiles: 12m squares
// Ring tile centers are placed flush against the base island's real extents
// (T1 plateau box in threeEngine: x in [-14, 12], z in [-13, 15]) so there is
// no overlap (z-fighting) and no gap between base island and ring tiles.
export const WORLD_BOUND_HALF = 27.5; // Square world clamp (covers the farthest ring edge)

// Catan-style fixed counts (sum must equal the number of ring tiles = 8).
// Guarantees resource availability by construction; POI biomes (ruined city/village) use a low count = rare.
export const RING_BIOME_COUNTS: Record<BiomeId, number> = {
  plains: 1,
  desert: 1,
  forest: 2,
  coast: 1,
  snowfield: 1,
  ruined_city: 1,
  ruined_village: 1,
};

interface NodeTemplate {
  type: ResourceNode['type'];
  resourceYield: ResourceNode['resourceYield'];
  hp: number;
  maxHp: number;
  yieldAmount: number;
  respawnTime: number;
  weight: number;
}

function tpl(
  type: ResourceNode['type'],
  resourceYield: ResourceNode['resourceYield'],
  hp: number,
  yieldAmount: number,
  respawnTime: number,
  weight: number
): NodeTemplate {
  return { type, resourceYield, hp, maxHp: hp, yieldAmount, respawnTime, weight };
}

export interface BiomeMeta {
  name: string;
  nameJa: string;
  color: number;
  minNodes: number;
  maxNodes: number;
  nodePool: NodeTemplate[];
}

export const BIOME_META: Record<BiomeId, BiomeMeta> = {
  plains: {
    name: 'Plains',
    nameJa: '平原',
    color: 0x82d93e,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('tree', 'wood', 3, 3, 12, 2),
      tpl('rock', 'stone', 4, 3, 15, 1),
      tpl('pumpkin_patch', 'pumpkin', 2, 3, 10, 1),
    ],
  },
  desert: {
    name: 'Desert',
    nameJa: '砂漠',
    color: 0xd9b26b,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('rock', 'stone', 4, 3, 15, 3),
      tpl('iron_ore', 'iron', 5, 3, 18, 1),
    ],
  },
  forest: {
    name: 'Forest',
    nameJa: '森林',
    color: 0x4e8f3b,
    minNodes: 1,
    maxNodes: 3,
    nodePool: [
      tpl('tree', 'wood', 3, 3, 12, 3),
      tpl('coconut_palm', 'coconut', 3, 2, 14, 1),
    ],
  },
  coast: {
    name: 'Coast',
    nameJa: '海岸',
    color: 0xc7e0c9,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('coconut_palm', 'coconut', 3, 2, 14, 2),
      tpl('rock', 'stone', 4, 3, 15, 1),
    ],
  },
  snowfield: {
    name: 'Snowfield',
    nameJa: '雪原',
    color: 0xe8eef2,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('rock', 'stone', 4, 3, 15, 2),
      tpl('iron_ore', 'iron', 5, 3, 18, 2),
    ],
  },
  ruined_city: {
    name: 'Ruined City',
    nameJa: '崩壊した都市',
    color: 0x8f8f8f,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('rock', 'stone', 4, 3, 15, 3),
      tpl('iron_ore', 'iron', 5, 3, 18, 1),
    ],
  },
  ruined_village: {
    name: 'Ruined Village',
    nameJa: '朽ち果てた村',
    color: 0xa58663,
    minNodes: 1,
    maxNodes: 2,
    nodePool: [
      tpl('pumpkin_patch', 'pumpkin', 2, 3, 10, 2),
      tpl('rock', 'stone', 4, 3, 15, 1),
    ],
  },
};

interface RingTilePlacement {
  tx: number;
  tz: number;
  centerX: number;
  centerZ: number;
}

// Flush against the base island edges: east x=12, west x=-14, north z=15, south z=-13.
const RING_PLACEMENTS: RingTilePlacement[] = [
  { tx: 1, tz: 0, centerX: 18, centerZ: 0 },
  { tx: -1, tz: 0, centerX: -20, centerZ: 0 },
  { tx: 0, tz: 1, centerX: 0, centerZ: 21 },
  { tx: 0, tz: -1, centerX: 0, centerZ: -19 },
  { tx: 1, tz: 1, centerX: 18, centerZ: 21 },
  { tx: 1, tz: -1, centerX: 18, centerZ: -19 },
  { tx: -1, tz: 1, centerX: -20, centerZ: 21 },
  { tx: -1, tz: -1, centerX: -20, centerZ: -19 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWeighted(pool: NodeTemplate[]): NodeTemplate {
  const total = pool.reduce((s, n) => s + n.weight, 0);
  let r = Math.random() * total;
  for (const n of pool) {
    r -= n.weight;
    if (r <= 0) return n;
  }
  return pool[pool.length - 1];
}

function makeBiomeCounts(): BiomeId[] {
  const list: BiomeId[] = [];
  (Object.keys(RING_BIOME_COUNTS) as BiomeId[]).forEach((b) => {
    for (let i = 0; i < RING_BIOME_COUNTS[b]; i++) list.push(b);
  });
  return list;
}

/**
 * Pre-generates a Catan-style world per "New Game".
 * - Chunk (0,0) = the fixed base island (plains, excluded from the random biome pool).
 * - 8 ring tiles around it get biomes from fixed counts (resource availability by construction).
 * - `fixedNodes` (hand-authored camp invariants) are never overlapped.
 */
export function generateWorld(fixedNodes: ResourceNode[] = []): WorldGeneration {
  const tiles: WorldTile[] = [];
  const nodes: ResourceNode[] = [];

  tiles.push({
    id: 'chunk_0_0',
    tx: 0,
    tz: 0,
    biome: 'plains',
    isBase: true,
    centerX: 0,
    centerZ: 0,
    halfSize: BASE_CHUNK_HALF,
  });

  const biomeAssignments = shuffle(makeBiomeCounts());
  const minNodeDist = 3.5;

  RING_PLACEMENTS.forEach((pos, i) => {
    const biome = biomeAssignments[i];
    const meta = BIOME_META[biome];
    const centerX = pos.centerX;
    const centerZ = pos.centerZ;

    tiles.push({
      id: `chunk_${pos.tx}_${pos.tz}`,
      tx: pos.tx,
      tz: pos.tz,
      biome,
      isBase: false,
      centerX,
      centerZ,
      halfSize: RING_TILE_HALF,
    });

    const nodeCount = meta.minNodes + Math.floor(Math.random() * (meta.maxNodes - meta.minNodes + 1));
    let placed = 0;
    let attempts = 0;
    while (placed < nodeCount && attempts < 40) {
      attempts++;
      const half = RING_TILE_HALF - 1.2;
      const x = centerX + (Math.random() * 2 - 1) * half;
      const z = centerZ + (Math.random() * 2 - 1) * half;

      const tooCloseToFixed = fixedNodes.some((n) => Math.hypot(n.x - x, n.z - z) < minNodeDist);
      const tooCloseToRing = nodes.some((n) => Math.hypot(n.x - x, n.z - z) < minNodeDist);
      if (tooCloseToFixed || tooCloseToRing) continue;

      const tmpl = pickWeighted(meta.nodePool);
      nodes.push({
        id: `ring_${pos.tx}_${pos.tz}_${placed}_${Math.random().toString(36).slice(2, 6)}`,
        type: tmpl.type,
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        hp: tmpl.hp,
        maxHp: tmpl.maxHp,
        resourceYield: tmpl.resourceYield,
        yieldAmount: tmpl.yieldAmount,
        respawnTime: tmpl.respawnTime,
        isDepleted: false,
      });
      placed++;
    }
  });

  return { tiles, nodes };
}