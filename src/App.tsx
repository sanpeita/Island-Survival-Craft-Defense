/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IslandThreeEngine } from './game/threeEngine';
import {
  createInitialGameState,
  updateGameWorld,
  saveGame,
  loadSavedGame,
  deleteSavedGame,
  shootInk,
  placeStructure,
  GameState,
} from './game/gameLogic';
import { CraftingRecipe, ResourceType, PlaceableStructureType } from './types/game';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { RecipeModal } from './components/RecipeModal';
import { SafehouseModal } from './components/SafehouseModal';
import { InventoryModal } from './components/InventoryModal';
import { EnemyLibraryModal } from './components/EnemyLibraryModal';
import { HelpModal } from './components/HelpModal';
import { MobileFrame } from './components/MobileFrame';
import { sounds } from './audio/soundManager';
import confetti from 'canvas-confetti';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<IslandThreeEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadSavedGame();
    return saved || createInitialGameState();
  });
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  // Controller Inputs
  const inputMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isAttackPressedRef = useRef<boolean>(false);

  // Modals state
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isSafehouseOpen, setIsSafehouseOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isEnemyLibraryOpen, setIsEnemyLibraryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Initialize Three.js Engine
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new IslandThreeEngine(canvasContainerRef.current);
    engineRef.current = engine;
    engine.start();

    // Initial sync
    engine.syncResourceNodes(gameStateRef.current.resourceNodes);
    engine.syncStructures(gameStateRef.current.structures);
    engine.syncTiles(gameStateRef.current.tiles || []);
    engine.updateFogOfWar(gameStateRef.current.revealedAreas);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Main Game Animation Loop (60 FPS)
  useEffect(() => {
    let lastTime = performance.now();
    let saveTimer = 0;
    let animationId: number;

    const loop = (currentTime: number) => {
      const deltaSeconds = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const engine = engineRef.current;
      if (engine) {
        // Only accept controller movement & attacks if actively playing
        const currentMove = isPlayingRef.current ? inputMoveRef.current : { x: 0, y: 0 };
        const currentAttack = isPlayingRef.current ? isAttackPressedRef.current : false;

        const { updatedState } = updateGameWorld(
          gameStateRef.current,
          deltaSeconds,
          currentMove,
          currentAttack,
          false,
          (text, x, y, z, color) => engine.spawnFloatingText(text, x, y, z, color),
          (res, x, z) => engine.spawnPickupDrop(res, x, z)
        );

        // Sync with 3D Engine
        engine.setTimeOfDay(updatedState.time.phase, updatedState.time.secondsInDay);
        engine.syncResourceNodes(updatedState.resourceNodes);
        engine.syncStructures(updatedState.structures);
        engine.syncTiles(updatedState.tiles || []);
        engine.syncEnemies(updatedState.enemies);
        engine.syncArrows(updatedState.projectiles);
        engine.syncInkProjectiles(updatedState.inkProjectiles);
        engine.syncInkSplatters(updatedState.inkSplatters);
        engine.syncGroundDrops(updatedState.groundDrops);
        engine.updateFogOfWar(updatedState.revealedAreas);

        // Update Hero 3D Pose
        engine.updateCharacterPose(
          updatedState.player.x,
          updatedState.player.z,
          updatedState.player.rotation,
          isPlayingRef.current ? updatedState.player.isMoving : false,
          isPlayingRef.current ? updatedState.player.isAttacking : false,
          updatedState.player.stats.equippedTool
        );

        // In-world 3D Cooking pot interaction
        if (isPlayingRef.current) {
          const pumpkinCount = updatedState.inventory.pumpkin || 0;
          const distToPot = Math.hypot(updatedState.player.x - (-4), updatedState.player.z - 3);
          if (distToPot < 2.0 && pumpkinCount >= 5 && isAttackPressedRef.current) {
            updatedState.inventory.pumpkin -= 5;
            updatedState.inventory.stew = (updatedState.inventory.stew || 0) + 1;
            sounds.playCraftSuccess();
            engine.spawnFloatingText('🍲 STEW COOKED!', -4, 2.5, 3, '#db6518');
          }
        }

        setGameState(updatedState);

        // Periodic auto save to LocalStorage (only when actively playing)
        if (isPlayingRef.current) {
          saveTimer += deltaSeconds;
          if (saveTimer > 5) {
            saveTimer = 0;
            saveGame(updatedState);
          }
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // --- TITLE MENU HANDLERS ---
  const handleStartNewGame = useCallback(() => {
    deleteSavedGame();
    const freshState = createInitialGameState();
    freshState.autoMode = gameStateRef.current.autoMode;
    setGameState(freshState);
    gameStateRef.current = freshState;

    if (engineRef.current) {
      engineRef.current.syncResourceNodes(freshState.resourceNodes);
      engineRef.current.syncStructures(freshState.structures);
      engineRef.current.syncTiles(freshState.tiles || []);
      engineRef.current.syncEnemies([]);
      engineRef.current.syncArrows([]);
      engineRef.current.syncInkProjectiles([]);
      engineRef.current.syncInkSplatters([]);
      engineRef.current.syncGroundDrops([]);
      engineRef.current.updateFogOfWar(freshState.revealedAreas);
      engineRef.current.spawnFloatingText('🏝️ NEW ADVENTURE STARTED!', 0, 3, -3.2, '#ffd700');
    }

    saveGame(freshState);
    setIsPlaying(true);
  }, []);

  const handleLoadGame = useCallback(() => {
    const loaded = loadSavedGame() || createInitialGameState();
    setGameState(loaded);
    gameStateRef.current = loaded;

    if (engineRef.current) {
      engineRef.current.syncResourceNodes(loaded.resourceNodes);
      engineRef.current.syncStructures(loaded.structures);
      engineRef.current.syncTiles(loaded.tiles || []);
      engineRef.current.syncEnemies(loaded.enemies || []);
      engineRef.current.syncArrows(loaded.projectiles || []);
      engineRef.current.syncInkProjectiles(loaded.inkProjectiles || []);
      engineRef.current.syncInkSplatters(loaded.inkSplatters || []);
      engineRef.current.syncGroundDrops(loaded.groundDrops || []);
      engineRef.current.updateFogOfWar(loaded.revealedAreas);
      engineRef.current.spawnFloatingText(`📖 DAY ${loaded.time.dayCount} RESUMED!`, loaded.player.x, 3, loaded.player.z, '#38bdf8');
    }

    setIsPlaying(true);
  }, []);

  const handleAutoModeChange = useCallback((enabled: boolean) => {
    setGameState(prev => {
      const next = { ...prev, autoMode: enabled };
      gameStateRef.current = next;
      return next;
    });
  }, []);

  const handleReturnToTitle = useCallback(() => {
    // Save current game state before exiting to title
    saveGame(gameStateRef.current);
    inputMoveRef.current = { x: 0, y: 0 };
    isAttackPressedRef.current = false;
    setIsRecipeOpen(false);
    setIsSafehouseOpen(false);
    setIsInventoryOpen(false);
    setIsEnemyLibraryOpen(false);
    setIsHelpOpen(false);
    setIsPlaying(false);
  }, []);

  // --- CONTROLLER HANDLERS ---
  const handleMove = useCallback((vec: { x: number; y: number }) => {
    inputMoveRef.current = vec;
  }, []);

  const handleAttack = useCallback((pressed: boolean) => {
    isAttackPressedRef.current = pressed;
  }, []);

  const handleShootInk = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    shootInk(gameStateRef.current, (text, x, y, z, color) => {
      engine.spawnFloatingText(text, x, y, z, color);
    });
  }, []);

  // --- CRAFTING ACTION ---
  const handleCraftRecipe = (recipe: CraftingRecipe, count: number = 1) => {
    if (!gameStateRef.current.isNearFabricator) return;
    const s = { ...gameStateRef.current };
    const maxPossible = Math.floor(
      Math.min(...recipe.inputs.map(i => (s.inventory[i.resource] || 0) / i.count))
    );
    const actualCount = Math.min(count, maxPossible);
    if (actualCount <= 0) return;

    // Deduct inputs
    for (const input of recipe.inputs) {
      s.inventory[input.resource] -= input.count * actualCount;
    }

    // Apply outputs
    if (recipe.id === 'ink_capsule') {
      s.player.ink = s.player.maxInk;
      if (engineRef.current) {
        engineRef.current.spawnFloatingText('🧪 INK FULLY REFILLED!', s.player.x, 2, s.player.z, '#ec4899');
      }
    } else if (recipe.output.type === 'resource') {
      const resId = recipe.output.id as ResourceType;
      s.inventory[resId] = (s.inventory[resId] || 0) + recipe.output.count * actualCount;
    } else if (recipe.output.type === 'tool') {
      s.player.stats.equippedTool = recipe.output.id as any;
      s.player.stats.attackPower += 20;
      s.player.stats.gatherPower += 1;
    } else if (recipe.output.type === 'building') {
      const buildId = recipe.output.id as PlaceableStructureType;
      s.placeableStructures = s.placeableStructures || { barricade: 0, spikes: 0, turret: 0, lantern: 0 };
      s.placeableStructures[buildId] = (s.placeableStructures[buildId] || 0) + recipe.output.count * actualCount;

      if (engineRef.current) {
        engineRef.current.spawnFloatingText(`📦 ${recipe.nameJa} を作成！HUDの設置ボタンで好きな場所に置けます`, s.player.x, 2.2, s.player.z, '#48bb32');
      }
    } else if (recipe.output.type === 'upgrade') {
      if (recipe.id === 'rescue_beacon') {
        s.islandCleared = true;
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
        if (engineRef.current) {
          engineRef.current.spawnFloatingText('🎉 ESCAPE BEACON LIT! RESCUE ARRIVED!', 0, 3, 0, '#ffea70');
        }
      }
    }

    // Check quests
    for (const q of s.quests) {
      if (q.targetType === 'craft' && q.targetId === recipe.output.id && !q.completed) {
        q.currentCount += actualCount;
        if (q.currentCount >= q.requiredCount) {
          q.completed = true;
          s.inventory.gold += q.rewardGold;
          s.inventory.gem += q.rewardGem;
        }
      }
    }

    setGameState(s);
    saveGame(s);
  };

  // --- MANUAL STRUCTURE PLACEMENT ---
  const handlePlaceStructure = (type: PlaceableStructureType) => {
    const s = { ...gameStateRef.current };
    const success = placeStructure(s, type, (text, x, y, z, color) => {
      if (engineRef.current) {
        engineRef.current.spawnFloatingText(text, x, y, z, color);
      }
    });

    if (success) {
      setGameState(s);
      saveGame(s);
    }
  };

  // --- PIN RECIPE ---
  const handlePinRecipe = (recipeId: string) => {
    setGameState(prev => {
      const next = { ...prev };
      next.pinnedRecipeId = prev.pinnedRecipeId === recipeId ? null : recipeId;
      return next;
    });
  };

  // --- SAFEHOUSE REPAIR & UPGRADE ---
  const handleRepairSafehouse = (costWood: number, costStone: number) => {
    setGameState(prev => {
      const next = { ...prev };
      next.inventory.wood -= costWood;
      next.inventory.stone -= costStone;
      next.safehouse.hp = next.safehouse.maxHp;
      if (engineRef.current) {
        engineRef.current.spawnFloatingText('✨ BASE REPAIRED TO FULL!', 0, 2.5, -4.5, '#48bb32');
      }
      saveGame(next);
      return next;
    });
  };

  const handleUpgradeSafehouse = () => {
    setGameState(prev => {
      const next = { ...prev };
      const newLvl = next.safehouse.level + 1;
      next.safehouse.level = newLvl;
      next.safehouse.maxHp += 200;
      next.safehouse.hp = next.safehouse.maxHp;
      next.safehouse.turretSlots += 1;
      next.safehouse.autoHealRate += 2;
      next.safehouse.tierName = newLvl === 2 ? 'Wooden Haven' : newLvl === 3 ? 'Fortified Bunker' : 'Island Citadel';
      next.safehouse.tierNameJa = newLvl === 2 ? '木造セーフハウス' : newLvl === 3 ? '要塞バンカー' : '孤島の城塞';

      const sh = next.structures.find(s => s.type === 'safehouse');
      if (sh) sh.level = newLvl;

      if (engineRef.current) {
        engineRef.current.spawnFloatingText(`🏰 BASE UPGRADED TO LV.${newLvl}!`, 0, 3, -4.5, '#ffc72b');
      }
      saveGame(next);
      return next;
    });
  };

  // --- QUICK EAT ---
  const handleQuickEat = () => {
    setGameState(prev => {
      if ((prev.inventory.stew || 0) <= 0) return prev;
      sounds.playEat();
      const next = { ...prev };
      next.inventory.stew -= 1;
      next.player.stats.hp = Math.min(next.player.stats.maxHp, next.player.stats.hp + 50);
      next.player.stats.hunger = 100;
      next.player.stats.san = Math.min(next.player.stats.maxSan, (next.player.stats.san ?? 50) + 25);
      if (engineRef.current) {
        engineRef.current.spawnFloatingText('+50 ❤️ HP +25 🧠 SAN', next.player.x, 2, next.player.z, '#48bb32');
      }
      return next;
    });
  };

  const handleEatFoodFromInventory = (food: 'stew' | 'coconut' | 'pumpkin') => {
    setGameState(prev => {
      if ((prev.inventory[food] || 0) <= 0) return prev;
      const next = { ...prev };
      next.inventory[food] -= 1;
      const heal = food === 'stew' ? 50 : food === 'coconut' ? 15 : 8;
      const sanHeal = food === 'stew' ? 25 : food === 'coconut' ? 12 : 6;
      next.player.stats.hp = Math.min(next.player.stats.maxHp, next.player.stats.hp + heal);
      next.player.stats.san = Math.min(next.player.stats.maxSan, (next.player.stats.san ?? 50) + sanHeal);
      if (engineRef.current) {
        engineRef.current.spawnFloatingText(`+${heal} ❤️ +${sanHeal} 🧠 SAN`, next.player.x, 2, next.player.z, '#48bb32');
      }
      return next;
    });
  };

  return (
    <MobileFrame>
      <div id="game-viewport-container" className="relative w-full h-full overflow-hidden bg-sky-300">
        {/* Three.js 3D WebGL Canvas Mount */}
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Title Screen or In-Game HUD */}
        {!isPlaying ? (
          <TitleScreen
            onStartNewGame={handleStartNewGame}
            onLoadGame={handleLoadGame}
            onOpenHelp={() => setIsHelpOpen(true)}
            autoMode={gameState.autoMode}
            onAutoModeChange={handleAutoModeChange}
          />
        ) : (
          <GameHUD
            gameState={gameState}
            onMove={handleMove}
            onAttack={handleAttack}
            onShootInk={handleShootInk}
            onOpenCrafting={() => setIsRecipeOpen(true)}
            onOpenSafehouse={() => setIsSafehouseOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenEnemyLibrary={() => setIsEnemyLibraryOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onQuickEat={handleQuickEat}
            onPinRecipeClick={handlePinRecipe}
            onReturnToTitle={handleReturnToTitle}
            onPlaceStructure={handlePlaceStructure}
          />
        )}

        {/* Modals */}
        <RecipeModal
          isOpen={isRecipeOpen}
          onClose={() => setIsRecipeOpen(false)}
          inventory={gameState.inventory}
          safehouseLevel={gameState.safehouse.level}
          pinnedRecipeId={gameState.pinnedRecipeId}
          isNearFabricator={gameState.isNearFabricator}
          onPinRecipe={handlePinRecipe}
          onCraftRecipe={handleCraftRecipe}
        />

        <EnemyLibraryModal
          isOpen={isEnemyLibraryOpen}
          onClose={() => setIsEnemyLibraryOpen(false)}
          enemyLibrary={gameState.enemyLibrary}
        />

        <SafehouseModal
          isOpen={isSafehouseOpen}
          onClose={() => setIsSafehouseOpen(false)}
          safehouse={gameState.safehouse}
          inventory={gameState.inventory}
          onRepair={handleRepairSafehouse}
          onUpgrade={handleUpgradeSafehouse}
        />

        <InventoryModal
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
          inventory={gameState.inventory}
          onEatFood={handleEatFoodFromInventory}
          onOpenCrafting={() => {
            setIsInventoryOpen(false);
            setIsRecipeOpen(true);
          }}
        />

        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </MobileFrame>
  );
}
