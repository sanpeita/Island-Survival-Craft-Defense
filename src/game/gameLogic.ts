import {
  ResourceType,
  ToolType,
  PlaceableStructureType,
  TimeOfDay,
  SafehouseState,
  PlacedStructure,
  ResourceNode,
  EnemyEntity,
  EnemyType,
  EnemyLibraryEntry,
  Projectile,
  InkProjectile,
  InkSplatter,
  PlayerStats,
  GameQuest,
  InventoryItem,
  FloatingDrop,
} from '../types/game';
import { INITIAL_ENEMY_LIBRARY } from '../data/enemyLibrary';
import { sounds } from '../audio/soundManager';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'island_survival_save_v2';

export interface RevealedArea {
  x: number;
  z: number;
  radius: number;
}

export interface GameState {
  player: {
    x: number;
    z: number;
    rotation: number;
    stats: PlayerStats;
    isMoving: boolean;
    isAttacking: boolean;
    ink: number;
    maxInk: number;
    selectedInkColor: string;
    lastFullWarningTime?: number;
    lastAttackTime?: number;
  };
  time: {
    dayCount: number;
    secondsInDay: number;
    dayDuration: number;
    phase: TimeOfDay;
    nightWaveTotal: number;
    nightWaveDefeated: number;
    isNightAlarmPlayed: boolean;
    isDaybreakPlayed: boolean;
  };
  inventory: Record<ResourceType, number>;
  safehouse: SafehouseState;
  structures: PlacedStructure[];
  resourceNodes: ResourceNode[];
  enemies: EnemyEntity[];
  projectiles: Projectile[];
  inkProjectiles: InkProjectile[];
  inkSplatters: InkSplatter[];
  groundDrops: FloatingDrop[];
  revealedAreas: RevealedArea[];
  placeableStructures: Record<PlaceableStructureType, number>;
  enemyLibrary: Record<EnemyType, EnemyLibraryEntry>;
  quests: GameQuest[];
  activeQuestId: string;
  pinnedRecipeId: string | null;
  islandCleared: boolean;
  isNearFabricator: boolean;
  autoMode: boolean;
  lastSavedTime: number;
  saveNotification: string | null;
}

export const INK_COLORS = ['#ec4899', '#06b6d4', '#84cc16', '#eab308', '#a855f7', '#f97316'];

export const MAX_ITEM_CAPACITY: Record<ResourceType, number> = {
  wood: 999,
  stone: 999,
  leaf: 999,
  brick: 999,
  rope: 999,
  coconut: 999,
  pumpkin: 999,
  stew: 99,
  iron: 999,
  gold: 99999,
  gem: 9999,
};

// --- SAN (正気度) システム定数 ---
export const SAN_MAX = 100;
export const SAN_RECOVER_SAFEHOUSE = 8;   // 自拠点（安全地帯）にいる間の回復 /秒
export const SAN_RECOVER_DAY = 1.5;       // 日中・屋外での微回復 /秒（夕方は昼扱い）
export const SAN_DRAIN_NIGHT = 4;         // 夜間・屋外でのスリップ減少 /秒
export const SAN_UNREVEALED_MULTIPLIER = 10; // インク未塗布の未踏領域では10倍速で減少

export function createInitialGameState(): GameState {
  const saved = loadSavedGame();
  if (saved) return saved;

  const initialNodes: ResourceNode[] = [
    // Trees on lower tier
    { id: 'tree_1', type: 'tree', x: -6, z: -1.5, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 3, respawnTime: 12, isDepleted: false },
    { id: 'tree_2', type: 'tree', x: -9, z: 6, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 3, respawnTime: 12, isDepleted: false },
    { id: 'tree_3', type: 'coconut_palm', x: 6, z: 8, hp: 3, maxHp: 3, resourceYield: 'coconut', yieldAmount: 2, respawnTime: 14, isDepleted: false },
    { id: 'tree_4', type: 'tree', x: 8, z: -3, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 3, respawnTime: 12, isDepleted: false },
    { id: 'tree_5', type: 'coconut_palm', x: 9, z: 4, hp: 3, maxHp: 3, resourceYield: 'coconut', yieldAmount: 2, respawnTime: 14, isDepleted: false },

    // Rocks on lower tier
    { id: 'rock_1', type: 'rock', x: -7, z: 9, hp: 4, maxHp: 4, resourceYield: 'stone', yieldAmount: 3, respawnTime: 15, isDepleted: false },
    { id: 'rock_2', type: 'rock', x: 7, z: -8, hp: 4, maxHp: 4, resourceYield: 'stone', yieldAmount: 3, respawnTime: 15, isDepleted: false },

    // Pumpkin farms
    { id: 'farm_1', type: 'pumpkin_patch', x: -2, z: 6, hp: 2, maxHp: 2, resourceYield: 'pumpkin', yieldAmount: 3, respawnTime: 10, isDepleted: false },
    { id: 'farm_2', type: 'pumpkin_patch', x: 1, z: 6, hp: 2, maxHp: 2, resourceYield: 'pumpkin', yieldAmount: 3, respawnTime: 10, isDepleted: false },
    { id: 'farm_3', type: 'pumpkin_patch', x: -0.5, z: 8.5, hp: 2, maxHp: 2, resourceYield: 'pumpkin', yieldAmount: 3, respawnTime: 10, isDepleted: false },

    // Upper Tier Nodes (Reached via stairs to the North-West high plateau)
    { id: 'tree_up_1', type: 'tree', x: -8.0, z: -8.0, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 4, respawnTime: 12, isDepleted: false },
    { id: 'rock_up_1', type: 'iron_ore', x: -6.5, z: -9.5, hp: 5, maxHp: 5, resourceYield: 'iron', yieldAmount: 3, respawnTime: 18, isDepleted: false },
    { id: 'tree_up_2', type: 'coconut_palm', x: -10.5, z: -9.5, hp: 3, maxHp: 3, resourceYield: 'coconut', yieldAmount: 3, respawnTime: 14, isDepleted: false },
  ];

  const initialStructures: PlacedStructure[] = [
    {
      id: 'main_safehouse',
      type: 'safehouse',
      level: 1,
      x: 0,
      z: -4.5,
      hp: 350,
      maxHp: 350,
    },
    {
      id: 'cooking_station',
      type: 'campfire',
      level: 1,
      x: -4,
      z: 3,
      hp: 150,
      maxHp: 150,
    },
    {
      id: 'default_turret_1',
      type: 'turret',
      level: 1,
      x: -3.8,
      z: -2.0,
      hp: 150,
      maxHp: 150,
      lastActionTime: 0,
    },
  ];

  const initialQuests: GameQuest[] = [
    {
      id: 'q_gather_wood',
      title: 'Gather Wood & Leaves',
      titleJa: '木とヤシの葉を採集しよう',
      description: 'Chop down palm trees to obtain building materials for defense.',
      targetType: 'gather',
      targetId: 'wood',
      currentCount: 0,
      requiredCount: 15,
      rewardGold: 50,
      rewardGem: 1,
      completed: false,
    },
    {
      id: 'q_open_territory',
      title: 'Ink Territory Discovery',
      titleJa: 'インクで未踏領域を開放しよう！',
      description: 'Spray colorful ink to unfog the island and discover uncharted resources.',
      targetType: 'craft',
      targetId: 'ink',
      currentCount: 0,
      requiredCount: 3,
      rewardGold: 80,
      rewardGem: 2,
      completed: false,
    },
    {
      id: 'q_craft_stew',
      title: 'Cook Pumpkin Stew',
      titleJa: 'パンプキンシチューを調理',
      description: 'Harvest pumpkins from the farm plot and cook hearty stew at the campfire.',
      targetType: 'craft',
      targetId: 'stew',
      currentCount: 0,
      requiredCount: 2,
      rewardGold: 80,
      rewardGem: 1,
      completed: false,
    },
    {
      id: 'q_build_turret',
      title: 'Construct Auto-Turret',
      titleJa: '自動砲台をクラフトして防衛強化',
      description: 'Build an Auto-Crossbow Turret to repel night raid monsters.',
      targetType: 'craft',
      targetId: 'turret',
      currentCount: 0,
      requiredCount: 1,
      rewardGold: 120,
      rewardGem: 2,
      completed: false,
    },
    {
      id: 'q_survive_night_1',
      title: 'Survive the Night Raid',
      titleJa: '夜の襲撃を生き延びろ！',
      description: 'Defend your Safehouse and eliminate all invading island monsters.',
      targetType: 'survive',
      currentCount: 0,
      requiredCount: 1,
      rewardGold: 200,
      rewardGem: 3,
      completed: false,
    },
  ];

  // Initial visible area: 10m x 10m around spawn and camp
  const initialRevealed: RevealedArea[] = [
    { x: 0, z: -4.5, radius: 6.2 }, // Camp and cabin interior
    { x: 0, z: 0.5, radius: 5.5 },   // Front clearing and farming area
    { x: -3.5, z: 2.5, radius: 4.5 }, // Campfire area
  ];

  return {
    player: {
      // Resume / Spawn at the Fabricator position inside the safe cabin
      x: 0,
      z: -3.2,
      rotation: 0,
      stats: {
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        hunger: 100,
        maxHunger: 100,
        san: 50,
        maxSan: 100,
        level: 1,
        gold: 150,
        equippedTool: 'wooden_axe',
        attackPower: 28,
        gatherPower: 1,
        speed: 5.8,
      },
      isMoving: false,
      isAttacking: false,
      ink: 45,
      maxInk: 45,
      selectedInkColor: '#ec4899',
      lastFullWarningTime: 0,
    },
    time: {
      dayCount: 1,
      secondsInDay: 10,
      dayDuration: 90, // 60s day, 10s sunset, 20s night
      phase: 'day',
      nightWaveTotal: 0,
      nightWaveDefeated: 0,
      isNightAlarmPlayed: false,
      isDaybreakPlayed: false,
    },
    inventory: {
      wood: 15,
      stone: 10,
      leaf: 18,
      brick: 2,
      rope: 3,
      coconut: 4,
      pumpkin: 6,
      stew: 1,
      iron: 0,
      gold: 150,
      gem: 2,
    },
    safehouse: {
      level: 1,
      hp: 350,
      maxHp: 350,
      shield: 50,
      tierName: 'Survival Camp Lodge',
      tierNameJa: 'サバイバルキャンプ旅小屋',
      turretSlots: 2,
      autoHealRate: 2,
    },
    structures: initialStructures,
    resourceNodes: initialNodes,
    enemies: [],
    projectiles: [],
    inkProjectiles: [],
    inkSplatters: [],
    groundDrops: [],
    revealedAreas: initialRevealed,
    placeableStructures: {
      barricade: 1,
      spikes: 1,
      turret: 0,
      lantern: 0,
    },
    enemyLibrary: JSON.parse(JSON.stringify(INITIAL_ENEMY_LIBRARY)),
    quests: initialQuests,
    activeQuestId: 'q_gather_wood',
    pinnedRecipeId: 'crossbow_turret',
    islandCleared: false,
    isNearFabricator: true,
    autoMode: true,
    lastSavedTime: Date.now(),
    saveNotification: null,
  };
}

export function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      // Always spawn player right at Fabricator location when loading
      parsed.player.x = 0;
      parsed.player.z = -3.2;
      parsed.player.lastFullWarningTime = 0;
      // SAN値マイグレーション（旧セーブには存在しないため初期化）
      parsed.player.stats.san = parsed.player.stats.san ?? 50;
      parsed.player.stats.maxSan = parsed.player.stats.maxSan ?? SAN_MAX;
      parsed.enemies = [];
      parsed.projectiles = [];
      parsed.inkProjectiles = [];
      parsed.groundDrops = parsed.groundDrops || [];
      parsed.isNearFabricator = true;
      parsed.autoMode = parsed.autoMode ?? true;
      if (!parsed.placeableStructures) {
        parsed.placeableStructures = {
          barricade: 1,
          spikes: 1,
          turret: 0,
          lantern: 0,
        };
      }
      if (!parsed.revealedAreas || parsed.revealedAreas.length === 0) {
        parsed.revealedAreas = [
          { x: 0, z: -4.5, radius: 6.2 },
          { x: 0, z: 0.5, radius: 5.5 },
          { x: -3.5, z: 2.5, radius: 4.5 },
        ];
      }
      if (!parsed.enemyLibrary) {
        parsed.enemyLibrary = JSON.parse(JSON.stringify(INITIAL_ENEMY_LIBRARY));
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved game', e);
  }
  return null;
}

export function isPositionInSafeZone(
  x: number,
  z: number,
  structures?: PlacedStructure[],
  safehouseLevel: number = 1
): boolean {
  // 1. Survival Cabin Main Base Camp: (0, -4.5), radius expands with level
  const baseRadius = 5.2 + (safehouseLevel - 1) * 0.6;
  if (Math.hypot(x - 0, z - (-4.5)) < baseRadius) return true;

  // 2. East Coastal Watch Post (完全安全地帯サブキャンプ)
  if (Math.hypot(x - 8.5, z - 4.5) < 3.6) return true;

  // 3. West Forest Outpost (完全安全地帯サブキャンプ)
  if (Math.hypot(x - (-8.5), z - 4.0) < 3.6) return true;

  // 4. Player-placed Warding Torch Lanterns (プレイヤーが配置した退魔の篝火ランタンの周囲は完全聖域)
  if (structures) {
    for (const struct of structures) {
      if (struct.type === 'lantern') {
        if (Math.hypot(x - struct.x, z - struct.z) < 4.8) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isPositionInRevealedArea(x: number, z: number, revealedAreas: RevealedArea[]): boolean {
  for (const area of revealedAreas) {
    const distSq = (x - area.x) ** 2 + (z - area.z) ** 2;
    if (distSq <= area.radius ** 2) {
      return true;
    }
  }
  return false;
}

/**
 * 敵は未踏領域の暗闇（Fog-of-War 未開放地点）から湧く！
 * プレイヤーがインクを撒いて安全地帯（開放領域）を広げるほど、
 * 敵のスポーン位置が遠ざかり、拠点の防衛が有利になる。
 */
export function findDarkSpawnPosition(
  revealedAreas: RevealedArea[],
  structures?: PlacedStructure[],
  safehouseLevel: number = 1
): { x: number; z: number; isDark: boolean } {
  const candidates: { x: number; z: number; darknessScore: number }[] = [];

  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const dist = 9.0 + Math.random() * 9.0; // Island outer wild range
    const cx = Math.cos(angle) * dist;
    const cz = Math.sin(angle) * dist;

    // Reject if inside any safe zone (main camp, sub-camps, lanterns)
    if (isPositionInSafeZone(cx, cz, structures, safehouseLevel)) continue;

    // Check if inside revealed territory
    let minDistToRevealed = 999;
    let isRevealed = false;

    for (const area of revealedAreas) {
      const d = Math.hypot(cx - area.x, cz - area.z) - area.radius;
      if (d <= 0) {
        isRevealed = true;
        break;
      }
      if (d < minDistToRevealed) {
        minDistToRevealed = d;
      }
    }

    if (!isRevealed) {
      // It's in the unrevealed pitch-black fog!
      candidates.push({ x: cx, z: cz, darknessScore: minDistToRevealed });
    }
  }

  if (candidates.length > 0) {
    // Pick from the best unrevealed dark locations
    candidates.sort((a, b) => b.darknessScore - a.darknessScore);
    const chosen = candidates[Math.floor(Math.random() * Math.min(candidates.length, 4))];
    return { x: chosen.x, z: chosen.z, isDark: true };
  }

  // Fallback to outer perimeter if whole island is illuminated
  const fallbackAngle = Math.random() * Math.PI * 2;
  const fallbackDist = 15.5 + Math.random() * 2;
  return {
    x: Math.cos(fallbackAngle) * fallbackDist,
    z: Math.sin(fallbackAngle) * fallbackDist,
    isDark: false,
  };
}

export function placeStructure(
  s: GameState,
  type: PlaceableStructureType,
  spawnFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void
): boolean {
  if (!s.placeableStructures || (s.placeableStructures[type] || 0) <= 0) {
    return false;
  }

  // Calculate position in front of player
  const rot = s.player.rotation;
  const placeDist = 1.35;
  const targetX = s.player.x + Math.sin(rot) * placeDist;
  const targetZ = s.player.z + Math.cos(rot) * placeDist;

  // Consume 1 from placeableStructures
  s.placeableStructures[type] -= 1;

  let maxHp = 150;
  let nameJa = '防衛設備';
  if (type === 'barricade') {
    maxHp = 220;
    nameJa = '7DTD風 木造スパイクバリケード';
  } else if (type === 'spikes') {
    maxHp = 100;
    nameJa = 'ウッドスパイク罠';
  } else if (type === 'turret') {
    maxHp = 180;
    nameJa = '自動クロスボウ砲台';
  } else if (type === 'lantern') {
    maxHp = 120;
    nameJa = '退魔の篝火ランタン';
    // Lanterns illuminate and reveal 5.5m around them!
    s.revealedAreas.push({ x: targetX, z: targetZ, radius: 5.5 });
  }

  const newStructure: PlacedStructure = {
    id: `placed_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    level: 1,
    x: Math.round(targetX * 10) / 10,
    z: Math.round(targetZ * 10) / 10,
    hp: maxHp,
    maxHp,
    lastActionTime: 0,
  };

  s.structures.push(newStructure);
  sounds.playCraftSuccess();
  spawnFloatingText(`🔨 ${nameJa} を設置!`, targetX, 1.4, targetZ, '#eab308');
  return true;
}

export function shootInk(
  s: GameState,
  spawnFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void
) {
  if (s.player.ink < 15) return;
  s.player.ink -= 15;
  sounds.playInkShoot();

  const rot = s.player.rotation;
  const shootSpeed = 6.2;
  const nextColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
  s.player.selectedInkColor = nextColor;

  s.inkProjectiles.push({
    id: `ink_${Date.now()}_${Math.random()}`,
    x: s.player.x + Math.sin(rot) * 0.5,
    y: 1.2,
    z: s.player.z + Math.cos(rot) * 0.5,
    vx: Math.sin(rot) * shootSpeed,
    vy: 3.2,
    vz: Math.cos(rot) * shootSpeed,
    color: nextColor,
    radius: 0.25,
    createdAt: performance.now(),
  });

  spawnFloatingText('💦 INK SHOT!', s.player.x, 2, s.player.z, nextColor);
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function getSavedGameSummary(): {
  dayCount: number;
  baseLevel: number;
  tierNameJa: string;
  gold: number;
  gem: number;
  timestamp: number;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return {
      dayCount: parsed.time?.dayCount || 1,
      baseLevel: parsed.safehouse?.level || 1,
      tierNameJa: parsed.safehouse?.tierNameJa || 'サバイバルキャンプ旅小屋',
      gold: parsed.inventory?.gold || parsed.player?.stats?.gold || 0,
      gem: parsed.inventory?.gem || 0,
      timestamp: parsed.lastSavedTime || Date.now(),
    };
  } catch {
    return null;
  }
}

export function deleteSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to delete saved game', e);
  }
}

export function saveGame(state: GameState) {
  try {
    state.lastSavedTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game to localStorage', e);
  }
}

// Item database helper for displaying inventories
export const INVENTORY_META: Record<ResourceType, Omit<InventoryItem, 'count'>> = {
  wood: { id: 'wood', name: 'Wood Planks', nameJa: '木材', icon: '🪵', color: '#b57842', category: 'raw' },
  stone: { id: 'stone', name: 'Stone Rock', nameJa: '石材', icon: '🪨', color: '#9ca8b5', category: 'raw' },
  leaf: { id: 'leaf', name: 'Palm Leaf', nameJa: 'ヤシの葉', icon: '🍃', color: '#48bb32', category: 'raw' },
  brick: { id: 'brick', name: 'Stone Brick', nameJa: '硬化レンガ', icon: '🧱', color: '#c27b4f', category: 'processed' },
  rope: { id: 'rope', name: 'Twined Rope', nameJa: 'ロープ', icon: '🪢', color: '#d1b46a', category: 'processed' },
  coconut: { id: 'coconut', name: 'Fresh Coconut', nameJa: 'ココナッツ', icon: '🥥', color: '#7a4e28', category: 'food' },
  pumpkin: { id: 'pumpkin', name: 'Farm Pumpkin', nameJa: 'パンプキン', icon: '🎃', color: '#ff7700', category: 'food' },
  stew: { id: 'stew', name: 'Hearty Stew', nameJa: '極上シチュー', icon: '🍲', color: '#db6518', category: 'food' },
  iron: { id: 'iron', name: 'Iron Ore', nameJa: '鉄鉱石', icon: '🔩', color: '#ccd3de', category: 'raw' },
  gold: { id: 'gold', name: 'Gold Coin', nameJa: 'ゴールド', icon: '🪙', color: '#ffc72b', category: 'valuable' },
  gem: { id: 'gem', name: 'Island Gem', nameJa: 'ジェム', icon: '💎', color: '#38bdf8', category: 'valuable' },
};

// --- SOLID COLLISION RESOLUTION ---
interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const CABIN_WALL_COLLIDERS: BoxCollider[] = [
  // North Wall (Back)
  { minX: -2.8, maxX: 2.8, minZ: -7.0, maxZ: -6.6 },
  // West Wall (Left)
  { minX: -2.9, maxX: -2.5, minZ: -6.8, maxZ: -2.1 },
  // East Wall (Right)
  { minX: 2.5, maxX: 2.9, minZ: -6.8, maxZ: -2.1 },
  // South Wall Left (leaving doorway open between -0.9 and 0.9)
  { minX: -2.8, maxX: -0.9, minZ: -2.4, maxZ: -2.0 },
  // South Wall Right
  { minX: 0.9, maxX: 2.8, minZ: -2.4, maxZ: -2.0 },
];

function resolveCollision(
  currX: number,
  currZ: number,
  targetX: number,
  targetZ: number,
  radius: number,
  nodes: ResourceNode[],
  structures: PlacedStructure[]
): { x: number; z: number } {
  let finalX = targetX;
  let finalZ = targetZ;

  // 1. Island boundary circular clamp
  const islandCenterZ = 0.5;
  const distFromCenter = Math.hypot(finalX, finalZ - islandCenterZ);
  const maxIslandRadius = 13.6;
  if (distFromCenter > maxIslandRadius) {
    const angle = Math.atan2(finalZ - islandCenterZ, finalX);
    finalX = Math.cos(angle) * maxIslandRadius;
    finalZ = islandCenterZ + Math.sin(angle) * maxIslandRadius;
  }

  // 2. Cabin Walls AABB Colliders
  for (const box of CABIN_WALL_COLLIDERS) {
    const closestX = Math.max(box.minX, Math.min(box.maxX, finalX));
    const closestZ = Math.max(box.minZ, Math.min(box.maxZ, finalZ));
    const dx = finalX - closestX;
    const dz = finalZ - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      finalX += (dx / dist) * overlap;
      finalZ += (dz / dist) * overlap;
    }
  }

  // 3. Fabricator machine physical cylinder collider at (0, -5.2)
  const fabDist = Math.hypot(finalX - 0, finalZ - (-5.2));
  const fabRadius = 0.85 + radius;
  if (fabDist < fabRadius) {
    const angle = Math.atan2(finalZ - (-5.2), finalX - 0);
    finalX = 0 + Math.cos(angle) * fabRadius;
    finalZ = -5.2 + Math.sin(angle) * fabRadius;
  }

  // 4. Resource Nodes (Trees, Rocks, Iron Ore) Cylindrical Colliders
  for (const node of nodes) {
    if (node.isDepleted) continue;
    const nodeRadius = node.type === 'pumpkin_patch' ? 0.3 : node.type === 'rock' || node.type === 'iron_ore' ? 0.8 : 0.7;
    const totalR = nodeRadius + radius;
    const nd = Math.hypot(finalX - node.x, finalZ - node.z);
    if (nd < totalR) {
      const angle = Math.atan2(finalZ - node.z, finalX - node.x);
      finalX = node.x + Math.cos(angle) * totalR;
      finalZ = node.z + Math.sin(angle) * totalR;
    }
  }

  // 5. Campfire / Cooking station collider at (-4, 3)
  const cfDist = Math.hypot(finalX - (-4), finalZ - 3);
  const cfRadius = 0.85 + radius;
  if (cfDist < cfRadius) {
    const angle = Math.atan2(finalZ - 3, finalX - (-4));
    finalX = -4 + Math.cos(angle) * cfRadius;
    finalZ = 3 + Math.sin(angle) * cfRadius;
  }

  return { x: finalX, z: finalZ };
}

// --- GAME LOOP STEPPING ---
export function updateGameWorld(
  state: GameState,
  deltaSeconds: number,
  inputMove: { x: number; y: number },
  isAttackPressed: boolean,
  isInkPressed: boolean,
  spawnFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void,
  spawnPickupDrop: (res: ResourceType, x: number, z: number) => void
): { updatedState: GameState; soundEffects: string[] } {
  const s = { ...state };
  const sfx: string[] = [];
  const now = performance.now();

  // --- 1. TIME OF DAY CYCLE ---
  s.time.secondsInDay += deltaSeconds;
  const dayLen = s.time.dayDuration; // 90s total
  const currentSec = s.time.secondsInDay % dayLen;

  let prevPhase = s.time.phase;
  if (currentSec < 55) {
    s.time.phase = 'day';
  } else if (currentSec < 68) {
    s.time.phase = 'sunset';
  } else if (currentSec < 86) {
    s.time.phase = 'night';
  } else {
    s.time.phase = 'sunrise';
  }

  // Sunset / Night siren alert trigger
  if (s.time.phase === 'sunset' && !s.time.isNightAlarmPlayed) {
    sounds.playNightAlarm();
    s.time.isNightAlarmPlayed = true;
    s.time.isDaybreakPlayed = false;
    spawnFloatingText('⚠️ NIGHT RAID APPROACHING!', s.player.x, 2, s.player.z, '#ff4444');
  }

  // Sunrise victory celebration
  if (s.time.phase === 'sunrise' && !s.time.isDaybreakPlayed) {
    sounds.playDaybreak();
    s.time.isDaybreakPlayed = true;
    s.time.isNightAlarmPlayed = false;
    s.time.dayCount += 1;

    // Victory rewards for surviving night
    const bonusGold = 60 + s.time.dayCount * 30;
    const bonusGem = 1;
    s.inventory.gold += bonusGold;
    s.inventory.gem += bonusGem;
    s.player.stats.gold += bonusGold;

    // Restore Safehouse HP
    s.safehouse.hp = Math.min(s.safehouse.maxHp, s.safehouse.hp + 100);
    s.player.stats.hp = Math.min(s.player.stats.maxHp, s.player.stats.hp + 40);

    spawnFloatingText(`☀️ DAY ${s.time.dayCount} SUNRISE! +${bonusGold}🪙 +${bonusGem}💎`, s.player.x, 2.5, s.player.z, '#ffea70');
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });

    // Mark survive quest
    for (const q of s.quests) {
      if (q.targetType === 'survive' && !q.completed) {
        q.currentCount += 1;
        if (q.currentCount >= q.requiredCount) {
          q.completed = true;
          s.inventory.gold += q.rewardGold;
          s.inventory.gem += q.rewardGem;
          spawnFloatingText(`🏆 QUEST COMPLETE: ${q.titleJa}!`, s.player.x, 2.8, s.player.z, '#48bb32');
        }
      }
    }
  }

  // --- 2. INK REGENERATION (時間経過でインク回復) ---
  s.player.ink = Math.min(s.player.maxInk, s.player.ink + 7.5 * deltaSeconds);

  // --- 3. MONSTER SPAWNING (未踏領域の暗闇からスポーン) ---
  if (s.time.phase === 'night') {
    const targetEnemies = 3 + s.time.dayCount * 2;
    if (s.enemies.length < targetEnemies && Math.random() < 0.045) {
      const spawnPos = findDarkSpawnPosition(s.revealedAreas, s.structures, s.safehouse.level);

      // Random enemy selection with slime, goblin, skeleton, shadow beast, boss golem
      let enemyType: EnemyType = 'goblin';
      const roll = Math.random();
      if (s.time.dayCount >= 3 && roll < 0.2) {
        enemyType = 'boss_golem';
      } else if (roll < 0.35) {
        enemyType = 'shadow_beast';
      } else if (roll < 0.6) {
        enemyType = 'skeleton';
      } else if (roll < 0.8) {
        enemyType = 'poison_slime';
      } else {
        enemyType = 'goblin';
      }

      const meta = s.enemyLibrary[enemyType] || INITIAL_ENEMY_LIBRARY[enemyType];

      s.enemies.push({
        id: `enemy_${Date.now()}_${Math.random()}`,
        type: enemyType,
        x: spawnPos.x,
        z: spawnPos.z,
        hp: meta.hp,
        maxHp: meta.hp,
        speed: meta.speed,
        damage: meta.damage,
        attackCooldown: 1.5,
        lastAttackTime: 0,
        target: Math.random() > 0.5 ? 'safehouse' : 'player',
      });
      const spawnMsg = spawnPos.isDark ? `💀 暗闇から ${meta.nameJa} 襲来!` : `👾 ${meta.nameJa} 出現!`;
      spawnFloatingText(spawnMsg, spawnPos.x, 1.5, spawnPos.z, '#ff3333');
    }
  }

  // --- 4. PLAYER MOVEMENT & COLLISION RESOLUTION ---
  const isMoving = Math.abs(inputMove.x) > 0.1 || Math.abs(inputMove.y) > 0.1;
  s.player.isMoving = isMoving;

  if (isMoving) {
    const moveSpeed = s.player.stats.speed * deltaSeconds;
    const targetX = s.player.x + inputMove.x * moveSpeed;
    const targetZ = s.player.z + inputMove.y * moveSpeed;

    const resolved = resolveCollision(
      s.player.x,
      s.player.z,
      targetX,
      targetZ,
      0.35, // player radius
      s.resourceNodes,
      s.structures
    );

    s.player.x = resolved.x;
    s.player.z = resolved.z;
    s.player.rotation = Math.atan2(inputMove.x, inputMove.y);
  }

  // --- 4.5. SAN（正気度）システム ---
  {
    const sanStats = s.player.stats;
    const inSafeZone = isPositionInSafeZone(s.player.x, s.player.z, s.structures, s.safehouse.level);
    const inRevealed = isPositionInRevealedArea(s.player.x, s.player.z, s.revealedAreas);

    let sanDelta = 0;
    if (inSafeZone) {
      // 自拠点（安全地帯）では常時回復
      sanDelta = SAN_RECOVER_SAFEHOUSE;
    } else if (s.time.phase === 'day' || s.time.phase === 'sunset') {
      // 日中（夕方は昼扱い）・屋外ではほんのわずか回復
      sanDelta = SAN_RECOVER_DAY;
    } else if (s.time.phase === 'night') {
      // 夜間・屋外ではスリップで減少（インク未塗布の未踏領域は10倍速）
      let drain = SAN_DRAIN_NIGHT;
      if (!inRevealed) drain *= SAN_UNREVEALED_MULTIPLIER;
      sanDelta = -drain;
    }
    // sunrise: SAN停滞（変化なし）

    sanStats.san = Math.max(0, Math.min(sanStats.maxSan, sanStats.san + sanDelta * deltaSeconds));

    // SANがゼロになったら自拠点（ファブリケーター前）へリスポーン
    if (sanStats.san <= 0) {
      sanStats.san = 50;
      s.player.x = 0;
      s.player.z = -3.2;
      spawnFloatingText('🌙 SAN 0... 自拠点へ気を失って帰還', 0, 2, -3.2, '#a855f7');
    }
  }

  // --- 5. FABRICATOR PROXIMITY & AUTO-SAVE (ファブリケーターへ触れるとセーブ) ---
  const fabDist = Math.hypot(s.player.x - 0, s.player.z - (-5.2));
  const isTouchingFabricator = fabDist < 2.0;
  s.isNearFabricator = isTouchingFabricator;

  if (isTouchingFabricator && Date.now() - s.lastSavedTime > 5000) {
    s.lastSavedTime = Date.now();
    saveGame(s);
    sounds.playSaveChime();
    s.saveNotification = '💾 オートセーブ完了 (Saved at Fabricator)';
    spawnFloatingText('💾 GAME AUTO-SAVED', 0, 2.5, -5.2, '#00f0ff');
    setTimeout(() => {
      s.saveNotification = null;
    }, 2800);
  }

  // --- 6. REMOVE EXPIRED INK SPLATTERS (一定時間経過で消滅してチカチカ防止) ---
  s.inkSplatters = s.inkSplatters.filter(sp => {
    const created = sp.createdAt || now;
    return (now - created) < (sp.lifetime || 14000);
  });

  // --- 7. GROUND ITEM PICKUP & "Full" INVENTORY CAPACITY CHECK ---
  let lastFullTime = s.player.lastFullWarningTime || 0;
  for (let i = s.groundDrops.length - 1; i >= 0; i--) {
    const drop = s.groundDrops[i];
    const dist = Math.hypot(drop.x - s.player.x, drop.z - s.player.z);

    if (dist < 4.0) {
      const currentCount = s.inventory[drop.resource] || 0;
      const maxCap = MAX_ITEM_CAPACITY[drop.resource] ?? 999;

      if (currentCount >= maxCap) {
        // Inventory is full for this item! Show "Full" above player
        if (now - lastFullTime > 1200) {
          lastFullTime = now;
          s.player.lastFullWarningTime = now;
          spawnFloatingText('Full', s.player.x, 2.6, s.player.z, '#ff4444');
        }
      } else {
        // Can pick up
        if (dist < 1.4) {
          const canTake = Math.min(drop.amount, maxCap - currentCount);
          s.inventory[drop.resource] = currentCount + canTake;
          if (drop.resource === 'gold') {
            s.player.stats.gold = (s.player.stats.gold || 0) + canTake;
          }

          sounds.playCollect();
          const meta = INVENTORY_META[drop.resource];
          const icon = meta?.icon || '📦';
          const color = meta?.color || '#ffd700';
          spawnFloatingText(`+${canTake} ${icon}`, s.player.x, 2.2, s.player.z, color);

          // Update gather quest progress on ground drop pickup
          for (const q of s.quests) {
            if (q.targetType === 'gather' && q.targetId === drop.resource && !q.completed) {
              q.currentCount += canTake;
              if (q.currentCount >= q.requiredCount) {
                q.completed = true;
                s.inventory.gold += q.rewardGold;
                s.inventory.gem += q.rewardGem;
                sounds.playCraftSuccess();
                spawnFloatingText(`🏆 QUEST COMPLETE: ${q.titleJa}!`, s.player.x, 2.8, s.player.z, '#48bb32');
              }
            }
          }

          if (canTake >= drop.amount) {
            s.groundDrops.splice(i, 1);
          } else {
            drop.amount -= canTake;
          }
        } else {
          // Vacuum magnet pull towards player
          const pullSpeed = 12.0;
          drop.x += ((s.player.x - drop.x) / dist) * pullSpeed * deltaSeconds;
          drop.z += ((s.player.z - drop.z) / dist) * pullSpeed * deltaSeconds;
        }
      }
    }
  }

  // --- 8. SPLATOON-LIKE INK SHOOTING (スプラトゥーン風インクで未踏領域開放) ---
  if (isInkPressed && s.player.ink >= 15) {
    s.player.ink -= 15;
    sounds.playInkShoot();

    const rot = s.player.rotation;
    const shootSpeed = 6.2;
    const nextColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
    s.player.selectedInkColor = nextColor;

    s.inkProjectiles.push({
      id: `ink_${Date.now()}_${Math.random()}`,
      x: s.player.x + Math.sin(rot) * 0.5,
      y: 1.2,
      z: s.player.z + Math.cos(rot) * 0.5,
      vx: Math.sin(rot) * shootSpeed,
      vy: 3.2, // arc upwards
      vz: Math.cos(rot) * shootSpeed,
      color: nextColor,
      radius: 0.25,
      createdAt: now,
    });

    spawnFloatingText('💦 INK SHOT!', s.player.x, 2, s.player.z, nextColor);
  }

  // --- 9. INK PROJECTILE PHYSICS & FOG-OF-WAR UNLOCKING ---
  const GRAVITY = 18;
  for (let i = s.inkProjectiles.length - 1; i >= 0; i--) {
    const ip = s.inkProjectiles[i];
    ip.vy -= GRAVITY * deltaSeconds;
    ip.x += ip.vx * deltaSeconds;
    ip.y += ip.vy * deltaSeconds;
    ip.z += ip.vz * deltaSeconds;

    // Land on ground
    if (ip.y <= 0.05) {
      sounds.playInkSplat();
      s.inkProjectiles.splice(i, 1);

      // Create Ink Splatter with lifetime
      const splatRadius = 1.8;
      s.inkSplatters.push({
        id: `splat_${Date.now()}_${Math.random()}`,
        x: ip.x,
        z: ip.z,
        radius: splatRadius,
        color: ip.color,
        rotation: Math.random() * Math.PI * 2,
        createdAt: now,
        lifetime: 14000,
      });
      if (s.inkSplatters.length > 25) {
        s.inkSplatters.shift(); // keep max 25 splatters for performance
      }

      // UNLOCK FOG OF WAR (未踏領域を開放)
      const revealRadius = 4.6;
      s.revealedAreas.push({
        x: ip.x,
        z: ip.z,
        radius: revealRadius,
      });

      spawnFloatingText('✨ 領域開放 (Unfogged)!', ip.x, 1.8, ip.z, ip.color);

      // Ink territory quest progress (インクで未踏領域を開放するミッション)
      for (const q of s.quests) {
        if (q.targetType === 'craft' && q.targetId === 'ink' && !q.completed) {
          q.currentCount += 1;
          if (q.currentCount >= q.requiredCount) {
            q.completed = true;
            s.inventory.gold += q.rewardGold;
            s.inventory.gem += q.rewardGem;
            sounds.playCraftSuccess();
            spawnFloatingText(`🏆 QUEST COMPLETE: ${q.titleJa}!`, s.player.x, 2.8, s.player.z, '#48bb32');
          }
        }
      }

      // Damage enemies in splash radius
      for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = s.enemies[eIdx];
        const dist = Math.hypot(enemy.x - ip.x, enemy.z - ip.z);
        if (dist < revealRadius * 0.65) {
          const inkDmg = 35;
          enemy.hp -= inkDmg;
          sounds.playMonsterHit();
          spawnFloatingText(`-${inkDmg} 💦`, enemy.x, 2.2, enemy.z, ip.color);

          // Record in Enemy Library (ダメージを与えたことがある敵を記録)
          if (s.enemyLibrary[enemy.type]) {
            const entry = s.enemyLibrary[enemy.type];
            if (!entry.damaged) {
              entry.damaged = true;
              entry.discovered = true;
              entry.firstEncounterDay = s.time.dayCount;
              sounds.playEnemyDiscovered();
              spawnFloatingText(`📖 敵図鑑解放: ${entry.nameJa}!`, enemy.x, 3.0, enemy.z, '#ffc72b');
            }
          }

          if (enemy.hp <= 0) {
            handleEnemyDefeat(s, enemy, eIdx, spawnFloatingText, spawnPickupDrop);
          }
        }
      }
    }
  }

  // --- 8. PLAYER GATHERING & ATTACKING ---
  let effectiveAttack = isAttackPressed;
  if (!effectiveAttack && s.autoMode) {
    for (const node of s.resourceNodes) {
      if (node.isDepleted) continue;
      if (Math.hypot(node.x - s.player.x, node.z - s.player.z) < 2.5) {
        effectiveAttack = true;
        break;
      }
    }
    if (!effectiveAttack) {
      for (const enemy of s.enemies) {
        if (Math.hypot(enemy.x - s.player.x, enemy.z - s.player.z) < 2.5) {
          effectiveAttack = true;
          break;
        }
      }
    }
  }
  s.player.isAttacking = effectiveAttack;

  if (effectiveAttack) {
    const lastAttack = s.player.lastAttackTime || 0;
    const canSwing = now - lastAttack >= 220; // Tactile swing rhythm (~4.5 hits/sec)

    if (canSwing) {
      s.player.lastAttackTime = now;

      // Check nearby resource nodes to harvest
      let hitNode = false;
      for (const node of s.resourceNodes) {
        if (node.isDepleted) continue;
        const dist = Math.hypot(node.x - s.player.x, node.z - s.player.z);
        if (dist < 2.5) {
          hitNode = true;
          node.hp -= 1;

          if (node.type === 'tree' || node.type === 'coconut_palm') {
            sounds.playChop();
            s.inventory.wood = (s.inventory.wood || 0) + 1;
            s.inventory.leaf = (s.inventory.leaf || 0) + 1;
            spawnPickupDrop('wood', node.x, node.z);

            // Spawn ground drops so items scatter and vacuum into inventory
            s.groundDrops.push({
              id: `drop_wood_${Date.now()}_${Math.random()}`,
              resource: 'wood',
              amount: 1,
              x: node.x + (Math.random() - 0.5) * 0.8,
              y: 1.0,
              z: node.z + (Math.random() - 0.5) * 0.8,
              createdAt: now,
            });

            if (node.type === 'coconut_palm' && Math.random() < 0.5) {
              s.groundDrops.push({
                id: `drop_coco_${Date.now()}_${Math.random()}`,
                resource: 'coconut',
                amount: 1,
                x: node.x + (Math.random() - 0.5) * 0.8,
                y: 1.0,
                z: node.z + (Math.random() - 0.5) * 0.8,
                createdAt: now,
              });
            }

            spawnFloatingText('+1 🪵 (+1 🌿)', node.x, 2, node.z, '#b57842');
          } else if (node.type === 'rock' || node.type === 'iron_ore') {
            sounds.playMine();
            const resType: ResourceType = node.type === 'iron_ore' ? 'iron' : 'stone';
            s.inventory[resType] = (s.inventory[resType] || 0) + 1;
            spawnPickupDrop(resType, node.x, node.z);

            s.groundDrops.push({
              id: `drop_rock_${Date.now()}_${Math.random()}`,
              resource: resType,
              amount: 1,
              x: node.x + (Math.random() - 0.5) * 0.8,
              y: 1.0,
              z: node.z + (Math.random() - 0.5) * 0.8,
              createdAt: now,
            });

            if (node.type === 'iron_ore') {
              spawnFloatingText('+1 🔩', node.x, 2, node.z, '#ccd3de');
            } else {
              spawnFloatingText('+1 🪨', node.x, 2, node.z, '#9ca8b5');
            }
          } else if (node.type === 'pumpkin_patch') {
            sounds.playCollect();
            s.inventory.pumpkin = (s.inventory.pumpkin || 0) + 2;
            spawnPickupDrop('pumpkin', node.x, node.z);
            s.groundDrops.push({
              id: `drop_pump_${Date.now()}_${Math.random()}`,
              resource: 'pumpkin',
              amount: 1,
              x: node.x + (Math.random() - 0.5) * 0.8,
              y: 1.0,
              z: node.z + (Math.random() - 0.5) * 0.8,
              createdAt: now,
            });
            spawnFloatingText('+2 🎃', node.x, 2, node.z, '#ff7700');
          }

          // Direct Quest Progress Check
          for (const q of s.quests) {
            if (q.targetType === 'gather' && q.targetId === node.resourceYield && !q.completed) {
              q.currentCount += 1;
              if (q.currentCount >= q.requiredCount) {
                q.completed = true;
                s.inventory.gold += q.rewardGold;
                s.inventory.gem += q.rewardGem;
                sounds.playCraftSuccess();
                spawnFloatingText(`🏆 QUEST COMPLETE: ${q.titleJa}!`, s.player.x, 2.5, s.player.z, '#48bb32');
              }
            }
          }

          // Node Depleted (Broken / Felled) - Burst with bonus ground loot!
          if (node.hp <= 0) {
            node.isDepleted = true;
            node.depletedUntil = now + node.respawnTime * 1000;
            sounds.playCraftSuccess();

            if (node.type === 'tree' || node.type === 'coconut_palm') {
              s.groundDrops.push({
                id: `drop_wood_bonus_${Date.now()}_1`,
                resource: 'wood',
                amount: 3,
                x: node.x + 0.4,
                y: 1.0,
                z: node.z + 0.4,
                createdAt: now,
              });
              s.groundDrops.push({
                id: `drop_leaf_bonus_${Date.now()}_2`,
                resource: 'leaf',
                amount: 2,
                x: node.x - 0.4,
                y: 1.0,
                z: node.z - 0.4,
                createdAt: now,
              });
              if (node.type === 'coconut_palm') {
                s.groundDrops.push({
                  id: `drop_coco_bonus_${Date.now()}_3`,
                  resource: 'coconut',
                  amount: 2,
                  x: node.x,
                  y: 1.0,
                  z: node.z + 0.5,
                  createdAt: now,
                });
              }
              spawnFloatingText('💥 伐採完了! (+3 🪵 +2 🌿)', node.x, 2.6, node.z, '#f59e0b');
            } else if (node.type === 'rock' || node.type === 'iron_ore') {
              const mainRes: ResourceType = node.type === 'iron_ore' ? 'iron' : 'stone';
              s.groundDrops.push({
                id: `drop_ore_bonus_${Date.now()}_1`,
                resource: mainRes,
                amount: 3,
                x: node.x + 0.4,
                y: 1.0,
                z: node.z - 0.4,
                createdAt: now,
              });
              s.groundDrops.push({
                id: `drop_stone_bonus_${Date.now()}_2`,
                resource: 'stone',
                amount: 2,
                x: node.x - 0.4,
                y: 1.0,
                z: node.z + 0.4,
                createdAt: now,
              });
              spawnFloatingText(`💥 採掘完了! (+3 ${node.type === 'iron_ore' ? '🔩' : '🪨'})`, node.x, 2.6, node.z, '#f59e0b');
            } else if (node.type === 'pumpkin_patch') {
              s.groundDrops.push({
                id: `drop_pump_bonus_${Date.now()}`,
                resource: 'pumpkin',
                amount: 3,
                x: node.x,
                y: 1.0,
                z: node.z,
                createdAt: now,
              });
              spawnFloatingText('💥 収穫完了! (+3 🎃)', node.x, 2.6, node.z, '#f59e0b');
            }
          }
          break;
        }
      }

      // Check nearby enemies to attack with weapon (if not hitting node or in range)
      if (!hitNode) {
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const enemy = s.enemies[i];
          const dist = Math.hypot(enemy.x - s.player.x, enemy.z - s.player.z);
          if (dist < 2.5) {
            sounds.playAttack();
            sounds.playMonsterHit();
            const dmg = s.player.stats.attackPower;
            enemy.hp -= dmg;
            spawnFloatingText(`-${dmg}⚔️`, enemy.x, 2.2, enemy.z, '#ff3333');

            // Knockback
            const kx = (enemy.x - s.player.x) / (dist || 1);
            const kz = (enemy.z - s.player.z) / (dist || 1);
            enemy.x += kx * 0.8;
            enemy.z += kz * 0.8;

            // Record in Enemy Library (ダメージを与えたことがある敵を記録)
            if (s.enemyLibrary[enemy.type]) {
              const entry = s.enemyLibrary[enemy.type];
              if (!entry.damaged) {
                entry.damaged = true;
                entry.discovered = true;
                entry.firstEncounterDay = s.time.dayCount;
                sounds.playEnemyDiscovered();
                spawnFloatingText(`📖 敵図鑑解放: ${entry.nameJa}!`, enemy.x, 3.0, enemy.z, '#ffc72b');
              }
            }

            if (enemy.hp <= 0) {
              handleEnemyDefeat(s, enemy, i, spawnFloatingText, spawnPickupDrop);
            }
            break;
          }
        }
      }
    }
  }

  // --- 9. RESOURCE RESPAWN SYSTEM ---
  for (const node of s.resourceNodes) {
    if (node.isDepleted && node.depletedUntil && now >= node.depletedUntil) {
      node.isDepleted = false;
      node.hp = node.maxHp;
      node.depletedUntil = undefined;
    }
  }

  // --- 10. AUTO-TURRET TARGETING & SHOOTING ---
  for (const struct of s.structures) {
    if (struct.type === 'turret') {
      const lastFire = struct.lastActionTime || 0;
      if (now - lastFire > 1200) {
        let nearestEnemy: EnemyEntity | null = null;
        let minDist = 9.0;
        for (const enemy of s.enemies) {
          const d = Math.hypot(enemy.x - struct.x, enemy.z - struct.z);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          struct.lastActionTime = now;
          sounds.playTurretShot();
          s.projectiles.push({
            id: `arrow_${Date.now()}_${Math.random()}`,
            x: struct.x,
            y: 1.4,
            z: struct.z,
            targetX: nearestEnemy.x,
            targetZ: nearestEnemy.z,
            speed: 16,
            damage: 30,
            type: 'arrow',
          });
        }
      }
    }
  }

  // --- 11. ARROW PROJECTILE MOVEMENT & IMPACT ---
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];
    const dx = p.targetX - p.x;
    const dz = p.targetZ - p.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.6) {
      for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = s.enemies[eIdx];
        if (Math.hypot(enemy.x - p.targetX, enemy.z - p.targetZ) < 1.4) {
          enemy.hp -= p.damage;
          sounds.playMonsterHit();
          spawnFloatingText(`-${p.damage}🏹`, enemy.x, 2, enemy.z, '#38bdf8');

          if (s.enemyLibrary[enemy.type] && !s.enemyLibrary[enemy.type].damaged) {
            s.enemyLibrary[enemy.type].damaged = true;
            s.enemyLibrary[enemy.type].discovered = true;
            s.enemyLibrary[enemy.type].firstEncounterDay = s.time.dayCount;
            sounds.playEnemyDiscovered();
          }

          if (enemy.hp <= 0) {
            handleEnemyDefeat(s, enemy, eIdx, spawnFloatingText, spawnPickupDrop);
          }
          break;
        }
      }
      s.projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * p.speed * deltaSeconds;
      p.z += (dz / dist) * p.speed * deltaSeconds;
    }
  }

  // --- 12. ENEMY AI & SAFEHOUSE BARRIER (サバイバルキャンプおよび聖域エリアへは敵は侵入不可) ---
  const isPlayerSafe = isPositionInSafeZone(s.player.x, s.player.z, s.structures, s.safehouse.level);

  for (const enemy of s.enemies) {
    // 1. Check if enemy is attempting to enter any safe zone (Camp, Sub-camps, Lanterns)
    if (isPositionInSafeZone(enemy.x, enemy.z, s.structures, s.safehouse.level)) {
      // Repel enemy away from nearest safe zone center
      let pushCenterX = 0;
      let pushCenterZ = -4.5;
      let minD = Math.hypot(enemy.x - 0, enemy.z - (-4.5));

      if (Math.hypot(enemy.x - 8.5, enemy.z - 4.5) < minD) {
        pushCenterX = 8.5;
        pushCenterZ = 4.5;
        minD = Math.hypot(enemy.x - 8.5, enemy.z - 4.5);
      }
      if (Math.hypot(enemy.x - (-8.5), enemy.z - 4.0) < minD) {
        pushCenterX = -8.5;
        pushCenterZ = 4.0;
        minD = Math.hypot(enemy.x - (-8.5), enemy.z - 4.0);
      }
      for (const st of s.structures) {
        if (st.type === 'lantern') {
          const d = Math.hypot(enemy.x - st.x, enemy.z - st.z);
          if (d < minD) {
            pushCenterX = st.x;
            pushCenterZ = st.z;
            minD = d;
          }
        }
      }

      const pushAngle = Math.atan2(enemy.z - pushCenterZ, enemy.x - pushCenterX);
      enemy.x += Math.cos(pushAngle) * 0.8;
      enemy.z += Math.sin(pushAngle) * 0.8;
      spawnFloatingText('🛡️ 聖域バリア反発', enemy.x, 1.8, enemy.z, '#38bdf8');
      continue;
    }

    // Target player if outside, or wander near border if player is inside safe zone
    const targetX = s.player.x;
    const targetZ = s.player.z;

    const dx = targetX - enemy.x;
    const dz = targetZ - enemy.z;
    const dist = Math.hypot(dx, dz);

    // Check if stepping on Spikes Trap
    for (const struct of s.structures) {
      if (struct.type === 'spikes' && Math.hypot(struct.x - enemy.x, struct.z - enemy.z) < 1.2) {
        enemy.hp -= 12 * deltaSeconds;
        spawnFloatingText('🩸', enemy.x, 1.2, enemy.z, '#ff2222');
      }
    }

    // 塗りたてのインク領域（残存インク）に触れている間は挙動（移動速度）が半減
    // スロウ効果自体はダメージを与えない
    let inkSlowed = false;
    for (const sp of s.inkSplatters) {
      if (Math.hypot(enemy.x - sp.x, enemy.z - sp.z) < sp.radius) {
        inkSlowed = true;
        break;
      }
    }
    const effectiveSpeed = inkSlowed ? enemy.speed * 0.5 : enemy.speed;

    if (dist > 1.3) {
      // If player is inside safe zone, enemy does not rush in directly
      if (!isPlayerSafe) {
        enemy.x += (dx / dist) * effectiveSpeed * deltaSeconds;
        enemy.z += (dz / dist) * effectiveSpeed * deltaSeconds;
      }
    } else {
      // Attack player if not in safe zone
      if (!isPlayerSafe && now - enemy.lastAttackTime > enemy.attackCooldown * 1000) {
        enemy.lastAttackTime = now;
        s.player.stats.hp = Math.max(0, s.player.stats.hp - enemy.damage);
        sounds.playMonsterHit();
        spawnFloatingText(`-${enemy.damage}❤️`, s.player.x, 2, s.player.z, '#ff0000');
        if (s.player.stats.hp <= 0) {
          // Respawn at Fabricator
          s.player.stats.hp = s.player.stats.maxHp;
          s.player.x = 0;
          s.player.z = -3.2;
          spawnFloatingText('🩹 RESPAWNED AT FABRICATOR', 0, 2, -3.2, '#38bdf8');
        }
      }
    }
  }

  // Advance active quest to next uncompleted quest (次のミッションへ自動進行)
  const nextQuest = s.quests.find(q => !q.completed);
  if (nextQuest) {
    s.activeQuestId = nextQuest.id;
  }

  return { updatedState: s, soundEffects: sfx };
}

// Helper when mob is defeated (敵を倒すことでもインク回復)
function handleEnemyDefeat(
  s: GameState,
  enemy: EnemyEntity,
  enemyIndex: number,
  spawnFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void,
  spawnPickupDrop: (res: ResourceType, x: number, z: number) => void
) {
  sounds.playCollect();
  s.enemies.splice(enemyIndex, 1);

  // INK REFILL ON ENEMY KILL (敵対mobを倒すことでインクが大幅回復)
  const inkRefill = 40;
  s.player.ink = Math.min(s.player.maxInk, s.player.ink + inkRefill);
  spawnFloatingText(`+${inkRefill} 💧 INK!`, enemy.x, 2.8, enemy.z, '#00f0ff');

  // Increment Defeat Count in Bestiary Library
  if (s.enemyLibrary[enemy.type]) {
    s.enemyLibrary[enemy.type].defeatedCount += 1;
    s.enemyLibrary[enemy.type].discovered = true;
    s.enemyLibrary[enemy.type].damaged = true;
  }

  // Rewards - Spawn physical Ground Drops (黄色いゴールドアイテムやドロップ品)
  const goldReward = enemy.type === 'boss_golem' ? 120 : enemy.type === 'shadow_beast' ? 45 : 20;
  const gemReward = enemy.type === 'boss_golem' ? 3 : Math.random() < 0.35 ? 1 : 0;
  const now = performance.now();

  // Spawn yellow item (Gold drop)
  s.groundDrops.push({
    id: `drop_gold_${Date.now()}_${Math.random()}`,
    resource: 'gold',
    amount: goldReward,
    x: enemy.x,
    y: 1.0,
    z: enemy.z,
    createdAt: now,
  });

  if (gemReward > 0) {
    s.groundDrops.push({
      id: `drop_gem_${Date.now()}_${Math.random()}`,
      resource: 'gem',
      amount: gemReward,
      x: enemy.x + (Math.random() - 0.5) * 0.6,
      y: 1.0,
      z: enemy.z + (Math.random() - 0.5) * 0.6,
      createdAt: now,
    });
  }

  if (enemy.type === 'goblin' || enemy.type === 'skeleton') {
    const bonusRes: ResourceType = enemy.type === 'goblin' ? 'iron' : 'stone';
    s.groundDrops.push({
      id: `drop_bonus_${Date.now()}_${Math.random()}`,
      resource: bonusRes,
      amount: 1,
      x: enemy.x + (Math.random() - 0.5) * 0.7,
      y: 1.0,
      z: enemy.z + (Math.random() - 0.5) * 0.7,
      createdAt: now,
    });
  }
}
