import {
  ResourceType,
  ToolType,
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
  revealedAreas: RevealedArea[];
  enemyLibrary: Record<EnemyType, EnemyLibraryEntry>;
  quests: GameQuest[];
  activeQuestId: string;
  pinnedRecipeId: string | null;
  islandCleared: boolean;
  isNearFabricator: boolean;
  lastSavedTime: number;
  saveNotification: string | null;
}

export const INK_COLORS = ['#ec4899', '#06b6d4', '#84cc16', '#eab308', '#a855f7', '#f97316'];

export function createInitialGameState(): GameState {
  const saved = loadSavedGame();
  if (saved) return saved;

  const initialNodes: ResourceNode[] = [
    // Trees on lower tier
    { id: 'tree_1', type: 'tree', x: -8, z: -2, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 3, respawnTime: 12, isDepleted: false },
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

    // Upper Tier Nodes (Reached via stairs)
    { id: 'tree_up_1', type: 'tree', x: -7, z: -8, hp: 3, maxHp: 3, resourceYield: 'wood', yieldAmount: 4, respawnTime: 12, isDepleted: false },
    { id: 'rock_up_1', type: 'iron_ore', x: -4, z: -10, hp: 5, maxHp: 5, resourceYield: 'iron', yieldAmount: 3, respawnTime: 18, isDepleted: false },
    { id: 'tree_up_2', type: 'coconut_palm', x: -10, z: -10, hp: 3, maxHp: 3, resourceYield: 'coconut', yieldAmount: 3, respawnTime: 14, isDepleted: false },
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
        level: 1,
        gold: 150,
        equippedTool: 'wooden_axe',
        attackPower: 28,
        gatherPower: 1,
        speed: 5.8,
      },
      isMoving: false,
      isAttacking: false,
      ink: 100,
      maxInk: 100,
      selectedInkColor: '#ec4899',
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
    revealedAreas: initialRevealed,
    enemyLibrary: JSON.parse(JSON.stringify(INITIAL_ENEMY_LIBRARY)),
    quests: initialQuests,
    activeQuestId: 'q_gather_wood',
    pinnedRecipeId: 'crossbow_turret',
    islandCleared: false,
    isNearFabricator: true,
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
      parsed.enemies = [];
      parsed.projectiles = [];
      parsed.inkProjectiles = [];
      parsed.isNearFabricator = true;
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

export function shootInk(
  s: GameState,
  spawnFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void
) {
  if (s.player.ink < 15) return;
  s.player.ink -= 15;
  sounds.playInkShoot();

  const rot = s.player.rotation;
  const shootSpeed = 13.5;
  const nextColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
  s.player.selectedInkColor = nextColor;

  s.inkProjectiles.push({
    id: `ink_${Date.now()}_${Math.random()}`,
    x: s.player.x + Math.sin(rot) * 0.5,
    y: 1.2,
    z: s.player.z + Math.cos(rot) * 0.5,
    vx: Math.sin(rot) * shootSpeed,
    vy: 5.5,
    vz: Math.cos(rot) * shootSpeed,
    color: nextColor,
    radius: 0.25,
    createdAt: performance.now(),
  });

  spawnFloatingText('💦 INK SHOT!', s.player.x, 2, s.player.z, nextColor);
}

export function saveGame(state: GameState) {
  try {
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

  // --- 3. NIGHT RAID MONSTER SPAWNING ---
  if (s.time.phase === 'night') {
    const targetEnemies = 3 + s.time.dayCount * 2;
    if (s.enemies.length < targetEnemies && Math.random() < 0.04) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14;
      const spawnX = Math.cos(angle) * dist;
      const spawnZ = Math.sin(angle) * dist;

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
        x: spawnX,
        z: spawnZ,
        hp: meta.hp,
        maxHp: meta.hp,
        speed: meta.speed,
        damage: meta.damage,
        attackCooldown: 1.5,
        lastAttackTime: 0,
        target: Math.random() > 0.5 ? 'safehouse' : 'player',
      });
      spawnFloatingText(`👾 ${meta.nameJa} 出現!`, spawnX, 1.5, spawnZ, '#ff3333');
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

  // --- 6. SPLATOON-LIKE INK SHOOTING (スプラトゥーン風インクで未踏領域開放) ---
  if (isInkPressed && s.player.ink >= 15) {
    s.player.ink -= 15;
    sounds.playInkShoot();

    const rot = s.player.rotation;
    const shootSpeed = 13.5;
    const nextColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
    s.player.selectedInkColor = nextColor;

    s.inkProjectiles.push({
      id: `ink_${Date.now()}_${Math.random()}`,
      x: s.player.x + Math.sin(rot) * 0.5,
      y: 1.2,
      z: s.player.z + Math.cos(rot) * 0.5,
      vx: Math.sin(rot) * shootSpeed,
      vy: 5.5, // arc upwards
      vz: Math.cos(rot) * shootSpeed,
      color: nextColor,
      radius: 0.25,
      createdAt: now,
    });

    spawnFloatingText('💦 INK SHOT!', s.player.x, 2, s.player.z, nextColor);
  }

  // --- 7. INK PROJECTILE PHYSICS & FOG-OF-WAR UNLOCKING ---
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

      // Create Ink Splatter
      const splatRadius = 2.4;
      s.inkSplatters.push({
        id: `splat_${Date.now()}_${Math.random()}`,
        x: ip.x,
        z: ip.z,
        radius: splatRadius,
        color: ip.color,
        rotation: Math.random() * Math.PI * 2,
      });
      if (s.inkSplatters.length > 25) {
        s.inkSplatters.shift(); // keep max 25 splatters for performance
      }

      // UNLOCK FOG OF WAR (未踏領域を開放)
      const revealRadius = 7.2;
      s.revealedAreas.push({
        x: ip.x,
        z: ip.z,
        radius: revealRadius,
      });

      spawnFloatingText('✨ 領域開放 (Unfogged)!', ip.x, 1.8, ip.z, ip.color);

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
  s.player.isAttacking = isAttackPressed;

  if (isAttackPressed) {
    // Check nearby resource nodes to harvest
    for (const node of s.resourceNodes) {
      if (node.isDepleted) continue;
      const dist = Math.hypot(node.x - s.player.x, node.z - s.player.z);
      if (dist < 2.3) {
        node.hp -= 1;
        if (node.type === 'tree' || node.type === 'coconut_palm') {
          sounds.playChop();
          spawnPickupDrop('wood', node.x, node.z);
          s.inventory.wood += 2;
          s.inventory.leaf += 1;
          if (node.type === 'coconut_palm' && Math.random() < 0.6) {
            s.inventory.coconut += 1;
            spawnPickupDrop('coconut', node.x, node.z);
          }
          spawnFloatingText('+2 🪵', node.x, 2, node.z, '#b57842');
        } else if (node.type === 'rock' || node.type === 'iron_ore') {
          sounds.playMine();
          spawnPickupDrop('stone', node.x, node.z);
          s.inventory.stone += 2;
          if (node.type === 'iron_ore') {
            s.inventory.iron += 2;
            spawnPickupDrop('iron', node.x, node.z);
            spawnFloatingText('+2 🔩', node.x, 2, node.z, '#ccd3de');
          } else {
            spawnFloatingText('+2 🪨', node.x, 2, node.z, '#9ca8b5');
          }
        } else if (node.type === 'pumpkin_patch') {
          sounds.playCollect();
          spawnPickupDrop('pumpkin', node.x, node.z);
          s.inventory.pumpkin += 3;
          spawnFloatingText('+3 🎃', node.x, 2, node.z, '#ff7700');
        }

        // Quest Progress Check
        for (const q of s.quests) {
          if (q.targetType === 'gather' && q.targetId === node.resourceYield && !q.completed) {
            q.currentCount += 2;
            if (q.currentCount >= q.requiredCount) {
              q.completed = true;
              s.inventory.gold += q.rewardGold;
              s.inventory.gem += q.rewardGem;
              spawnFloatingText(`🏆 QUEST COMPLETE: ${q.titleJa}!`, s.player.x, 2.5, s.player.z, '#48bb32');
            }
          }
        }

        if (node.hp <= 0) {
          node.isDepleted = true;
          node.depletedUntil = now + node.respawnTime * 1000;
        }
        break;
      }
    }

    // Check nearby enemies to attack with weapon
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

  // --- 12. ENEMY AI & SAFEHOUSE BARRIER (サバイバルキャンプエリアへは敵は侵入不可) ---
  const campCenterX = 0;
  const campCenterZ = -4.5;
  const safeAreaRadius = 5.2; // Enemy cannot enter this radius

  for (const enemy of s.enemies) {
    // Check distance to SafeArea
    const distToCamp = Math.hypot(enemy.x - campCenterX, enemy.z - campCenterZ);

    // If enemy tries to enter SafeArea, repel them back to the barrier edge
    if (distToCamp < safeAreaRadius) {
      const pushAngle = Math.atan2(enemy.z - campCenterZ, enemy.x - campCenterX);
      enemy.x = campCenterX + Math.cos(pushAngle) * (safeAreaRadius + 0.1);
      enemy.z = campCenterZ + Math.sin(pushAngle) * (safeAreaRadius + 0.1);
      spawnFloatingText('🛡️ BARRIER REPEL', enemy.x, 1.8, enemy.z, '#38bdf8');
      continue;
    }

    // Target either Player or roam towards barrier edge
    const isPlayerInSafeArea = Math.hypot(s.player.x - campCenterX, s.player.z - campCenterZ) < safeAreaRadius;
    const targetX = isPlayerInSafeArea ? campCenterX + ((enemy.x - campCenterX) / distToCamp) * safeAreaRadius : s.player.x;
    const targetZ = isPlayerInSafeArea ? campCenterZ + ((enemy.z - campCenterZ) / distToCamp) * safeAreaRadius : s.player.z;

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

    if (dist > 1.3) {
      enemy.x += (dx / dist) * enemy.speed * deltaSeconds;
      enemy.z += (dz / dist) * enemy.speed * deltaSeconds;
    } else {
      // Attack player if not in safehouse
      if (!isPlayerInSafeArea && now - enemy.lastAttackTime > enemy.attackCooldown * 1000) {
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

  // Rewards
  const goldReward = enemy.type === 'boss_golem' ? 120 : enemy.type === 'shadow_beast' ? 45 : 20;
  const gemReward = enemy.type === 'boss_golem' ? 3 : Math.random() < 0.35 ? 1 : 0;

  s.inventory.gold += goldReward;
  s.inventory.gem += gemReward;
  spawnPickupDrop('gold', enemy.x, enemy.z);
  spawnFloatingText(`+${goldReward}🪙`, enemy.x, 2.2, enemy.z, '#ffc72b');

  if (gemReward > 0) {
    spawnPickupDrop('gem', enemy.x + 0.3, enemy.z + 0.3);
    spawnFloatingText(`+${gemReward}💎`, enemy.x, 2.5, enemy.z, '#38bdf8');
  }
}
