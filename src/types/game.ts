export type ResourceType = 
  | 'wood' 
  | 'stone' 
  | 'leaf' 
  | 'brick' 
  | 'rope' 
  | 'coconut' 
  | 'pumpkin' 
  | 'stew' 
  | 'iron' 
  | 'gold' 
  | 'gem';

export type ToolType = 'hands' | 'wooden_axe' | 'stone_axe' | 'iron_axe' | 'sword' | 'bow';

export interface InventoryItem {
  id: ResourceType;
  name: string;
  nameJa: string;
  count: number;
  icon: string;
  color: string;
  category: 'raw' | 'processed' | 'food' | 'valuable';
}

export type RecipeCategory = 'tools' | 'defense' | 'building' | 'food' | 'expansion';

export interface CraftingRequirement {
  resource: ResourceType;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  category: RecipeCategory;
  stationType?: 'workbench' | 'campfire' | 'anvil' | 'safehouse' | 'hand';
  inputs: CraftingRequirement[];
  output: {
    type: 'resource' | 'tool' | 'building' | 'upgrade';
    id: string;
    count: number;
  };
  unlockSafehouseLevel: number;
  icon: string;
}

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'sunrise';

export interface SafehouseState {
  level: number;
  hp: number;
  maxHp: number;
  shield: number;
  tierName: string;
  tierNameJa: string;
  turretSlots: number;
  autoHealRate: number;
}

export interface PlacedStructure {
  id: string;
  type: 'safehouse' | 'campfire' | 'workbench' | 'turret' | 'barricade' | 'spikes' | 'lantern';
  level: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  lastActionTime?: number;
}

export interface ResourceNode {
  id: string;
  type: 'tree' | 'rock' | 'pumpkin_patch' | 'iron_ore' | 'coconut_palm';
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  resourceYield: ResourceType;
  yieldAmount: number;
  respawnTime: number; // in seconds
  isDepleted: boolean;
  depletedUntil?: number;
}

export type EnemyType = 'goblin' | 'skeleton' | 'shadow_beast' | 'boss_golem' | 'poison_slime';

export interface EnemyLibraryEntry {
  type: EnemyType;
  name: string;
  nameJa: string;
  threatLevel: number; // 1 - 5 stars
  descriptionJa: string;
  hp: number;
  damage: number;
  speed: number;
  weaknessJa: string;
  habitatJa: string;
  dropItems: ResourceType[];
  discovered: boolean;
  damaged: boolean;
  defeatedCount: number;
  firstEncounterDay?: number;
}

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  target: 'player' | 'safehouse' | 'turret' | 'barricade';
}

export interface InkProjectile {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  radius: number;
  createdAt: number;
}

export interface InkSplatter {
  id: string;
  x: number;
  z: number;
  radius: number;
  color: string;
  rotation: number;
  createdAt?: number;
  lifetime?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  damage: number;
  type: 'arrow' | 'fireball' | 'magic_bolt';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  createdAt: number;
}

export interface FloatingDrop {
  id: string;
  resource: ResourceType;
  amount: number;
  x: number;
  y: number;
  z: number;
  createdAt: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  hunger: number;
  maxHunger: number;
  level: number;
  gold: number;
  equippedTool: ToolType;
  attackPower: number;
  gatherPower: number;
  speed: number;
}

export interface GameQuest {
  id: string;
  title: string;
  titleJa: string;
  description: string;
  targetType: 'gather' | 'craft' | 'survive' | 'upgrade' | 'kill';
  targetId?: string;
  currentCount: number;
  requiredCount: number;
  rewardGold: number;
  rewardGem: number;
  completed: boolean;
}
