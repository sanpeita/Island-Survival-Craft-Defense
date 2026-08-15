import React, { useState } from 'react';
import { ResourceType, PlaceableStructureType } from '../types/game';
import { GameState, INVENTORY_META } from '../game/gameLogic';
import { CRAFTING_RECIPES } from '../data/recipes';
import { VirtualJoystick } from './VirtualJoystick';
import { sounds } from '../audio/soundManager';
import {
  Volume2,
  VolumeX,
  Hammer,
  Backpack,
  Home,
  Utensils,
  Sword,
  Search,
  Pin,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Droplets,
  Save,
  Sparkles,
  LogOut,
  Shield,
  Flame,
  Crosshair,
} from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  onMove: (vector: { x: number; y: number }) => void;
  onAttack: (pressed: boolean) => void;
  onShootInk: () => void;
  onOpenCrafting: () => void;
  onOpenSafehouse: () => void;
  onOpenInventory: () => void;
  onOpenEnemyLibrary: () => void;
  onOpenHelp: () => void;
  onQuickEat: () => void;
  onPinRecipeClick: (recipeId: string) => void;
  onReturnToTitle?: () => void;
  onPlaceStructure?: (type: PlaceableStructureType) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  onMove,
  onAttack,
  onShootInk,
  onOpenCrafting,
  onOpenSafehouse,
  onOpenInventory,
  onOpenEnemyLibrary,
  onOpenHelp,
  onQuickEat,
  onPinRecipeClick,
  onReturnToTitle,
  onPlaceStructure,
}) => {
  const { player, time, inventory, safehouse, quests, activeQuestId, pinnedRecipeId, isNearFabricator, saveNotification, enemyLibrary, placeableStructures } = gameState;
  const isSoundActive = sounds.isEnabled();
  const [showFullInventory, setShowFullInventory] = useState(false);
  const [showQuestList, setShowQuestList] = useState(false);

  const activeQuest = quests.find(q => q.id === activeQuestId) || quests[0];
  const pinnedRecipe = CRAFTING_RECIPES.find(r => r.id === pinnedRecipeId);

  const canCraftPinned = pinnedRecipe
    ? pinnedRecipe.inputs.every(i => (inventory[i.resource] || 0) >= i.count)
    : false;

  const hpPercent = Math.round((player.stats.hp / player.stats.maxHp) * 100);
  const sanPercent = Math.round((player.stats.san / player.stats.maxSan) * 100);
  const inkPercent = Math.round((player.ink / player.maxInk) * 100);
  const discoveredEnemyCount = (Object.values(enemyLibrary) as Array<{ damaged?: boolean }>).filter(e => e.damaged).length;

  // Time remaining in current cycle
  const daySec = Math.floor(time.secondsInDay % time.dayDuration);
  const dayRemaining = Math.max(0, time.dayDuration - daySec);
  const dayMinutes = Math.floor(dayRemaining / 60);
  const dayRemainingSeconds = dayRemaining % 60;
  const timeFormatted = `${String(dayMinutes).padStart(2, '0')}:${String(dayRemainingSeconds).padStart(2, '0')}`;
  const dayProgressPct = Math.min(100, Math.round((daySec / time.dayDuration) * 100));

  const allItems: Array<{ id: ResourceType; count: number; icon: string }> = [
    { id: 'wood', count: inventory.wood || 0, icon: '🪵' },
    { id: 'stone', count: inventory.stone || 0, icon: '🪨' },
    { id: 'leaf', count: inventory.leaf || 0, icon: '🍃' },
    { id: 'brick', count: inventory.brick || 0, icon: '🧱' },
    { id: 'rope', count: inventory.rope || 0, icon: '🪢' },
    { id: 'coconut', count: inventory.coconut || 0, icon: '🥥' },
    { id: 'pumpkin', count: inventory.pumpkin || 0, icon: '🎃' },
    { id: 'stew', count: inventory.stew || 0, icon: '🍲' },
  ];

  const visibleItems = showFullInventory ? allItems : allItems.filter(i => i.count > 0 || ['wood', 'stone', 'leaf'].includes(i.id)).slice(0, 4);

  // Placeable items summary
  const placeableItems: Array<{ type: PlaceableStructureType; name: string; icon: string; count: number; color: string }> = [
    { type: 'barricade' as PlaceableStructureType, name: '7DTD木製バリケード', icon: '🪵', count: placeableStructures?.barricade || 0, color: 'border-amber-700 bg-amber-950/80 text-amber-300' },
    { type: 'spikes' as PlaceableStructureType, name: 'スパイク罠', icon: '📌', count: placeableStructures?.spikes || 0, color: 'border-orange-700 bg-orange-950/80 text-orange-300' },
    { type: 'turret' as PlaceableStructureType, name: '自動クロスボウ砲台', icon: '🏹', count: placeableStructures?.turret || 0, color: 'border-cyan-700 bg-cyan-950/80 text-cyan-300' },
    { type: 'lantern' as PlaceableStructureType, name: '退魔の篝火ランタン', icon: '🔥', count: placeableStructures?.lantern || 0, color: 'border-yellow-700 bg-yellow-950/80 text-yellow-300' },
  ].filter(p => p.count > 0);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 select-none z-10 overflow-hidden font-sans safe-top safe-bottom safe-left safe-right">
      {/* --- TOP ROW (Optimized for iPhone 16 screen width: 393px) --- */}
      <div className="w-full flex items-center justify-between gap-1 pointer-events-auto">
        {/* Top Left: Base Level & Player HP (Compact) */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#121212]/90 backdrop-blur-md border border-[#333] shadow-lg shrink-0">
          {/* Safehouse Level */}
          <div
            onClick={onOpenSafehouse}
            className="flex flex-col cursor-pointer group"
            title="拠点を管理"
          >
            <span className="text-[7px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Camp
            </span>
            <span className="text-[10px] font-mono font-bold text-[#e0e0e0] group-hover:text-cyan-300 transition-colors whitespace-nowrap">
              Lv.{safehouse.level}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#333]" />

          {/* Vitals: HP + SAN Meters */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-red-500 text-[10px] font-bold">❤</span>
              <div className="flex flex-col w-12 sm:w-16">
                <div className="flex justify-between items-center text-[7.5px] text-gray-400 font-mono">
                  <span className="text-[#e0e0e0] font-bold">{player.stats.hp}/{player.stats.maxHp}</span>
                </div>
                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-0.5 border border-[#333]/50">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-600 to-amber-500"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-purple-400 text-[10px] font-bold">🧠</span>
              <div className="flex flex-col w-12 sm:w-16">
                <div className="flex justify-between items-center text-[7.5px] text-gray-400 font-mono">
                  <span className="text-[#e0e0e0] font-bold">{player.stats.san}/{player.stats.maxSan}</span>
                </div>
                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-0.5 border border-[#333]/50">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-700 to-fuchsia-400"
                    style={{ width: `${sanPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Center: Time of Day & Currency (Compact) */}
        <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-xl bg-[#121212]/90 backdrop-blur-md border border-[#333] shadow-lg shrink">
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-gray-500 uppercase font-bold">D.{time.dayCount}</span>
            <span className={`font-mono text-[9px] font-bold ${time.phase === 'night' ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
              {timeFormatted}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#333]" />

          <div className="flex items-center gap-1 text-[9px] font-mono">
            <span className="text-amber-400 flex items-center font-bold">
              <span>🪙</span><span>{inventory.gold}</span>
            </span>
            <span className="text-cyan-400 flex items-center font-bold">
              <span>💎</span><span>{inventory.gem}</span>
            </span>
          </div>
        </div>

        {/* Top Right: Sound, Help & Title Exit (Guaranteed to fit iPhone 16) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="toggle-sound-btn"
            onClick={() => sounds.toggleSound()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 backdrop-blur-md border border-[#333] flex items-center justify-center text-[#e0e0e0] hover:border-amber-500/50 transition-all shadow-md cursor-pointer"
            title="サウンド切替"
          >
            {isSoundActive ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>
          <button
            id="help-btn"
            onClick={onOpenHelp}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 backdrop-blur-md border border-[#333] flex items-center justify-center text-[#e0e0e0] hover:border-amber-500/50 transition-all shadow-md cursor-pointer"
            title="遊び方ガイド"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
          </button>
          {onReturnToTitle && (
            <button
              id="return-title-btn"
              onClick={onReturnToTitle}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#121212]/90 hover:bg-red-950/80 active:scale-95 backdrop-blur-md border border-[#333] hover:border-red-500/50 flex items-center justify-center text-red-300 transition-all shadow-md cursor-pointer"
              title="タイトル画面へ戻る"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Near Fabricator Indicator */}
      {isNearFabricator && (
        <div className="w-full flex justify-center mt-1 pointer-events-auto">
          <div
            onClick={onOpenCrafting}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all animate-bounce"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-300">3D万能ファブリケーター (セーブ/工作機)</span>
          </div>
        </div>
      )}

      {/* --- AUTO SAVE FLOATING BANNER --- */}
      {saveNotification && (
        <div className="w-full flex justify-center mt-1 pointer-events-none animate-fade-in">
          <div className="px-4 py-1.5 rounded-full bg-cyan-950/95 border border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2">
            <Save className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="text-xs font-bold text-cyan-200">{saveNotification}</span>
          </div>
        </div>
      )}

      {/* --- QUEST TRACKER --- */}
      {quests.length > 0 && (
        <div className="w-full flex flex-col items-center mt-1 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            {activeQuest && (
              <div
                onClick={onOpenCrafting}
                className={`group px-3 py-1 bg-[#121212]/95 backdrop-blur-md border rounded-xl shadow-2xl flex items-center gap-2 cursor-pointer active:scale-98 transition-all max-w-[300px] ${
                  activeQuest.completed ? 'border-emerald-500/50' : 'border-[#333] hover:border-amber-500/60'
                }`}
                title="クラフト画面を開く"
              >
                <div className="w-5 h-5 rounded-lg bg-amber-950/40 border border-amber-900/60 flex items-center justify-center text-[10px] shrink-0">
                  {activeQuest.completed ? '✅' : '🎯'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[8px] uppercase tracking-wider text-amber-500 font-bold leading-tight">
                    Objective
                  </span>
                  {activeQuest.completed ? (
                    <span className="text-[11px] font-serif italic text-emerald-300 leading-tight truncate">
                      達成済み: {activeQuest.titleJa}
                    </span>
                  ) : (
                    <span className="text-[11px] font-serif italic text-[#e0e0e0] leading-tight truncate group-hover:text-amber-300 transition-colors">
                      {activeQuest.titleJa} ({activeQuest.currentCount}/{activeQuest.requiredCount})
                    </span>
                  )}
                </div>
                <Search className="w-3 h-3 text-gray-500 ml-auto shrink-0 group-hover:text-amber-400 transition-colors" />
              </div>
            )}

            <button
              onClick={() => setShowQuestList(!showQuestList)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#121212]/95 backdrop-blur-md border border-[#333] hover:border-amber-500/50 text-[10px] font-bold text-amber-400 transition-all cursor-pointer"
              title="ミッション一覧"
            >
              {showQuestList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              一覧
            </button>
          </div>

          {/* Quest List Dropdown */}
          {showQuestList && (
            <div className="mt-1.5 w-full max-w-[340px] bg-[#121212]/95 backdrop-blur-md border border-[#333] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
              {quests.map(q => (
                <div
                  key={q.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#222] last:border-b-0 ${
                    q.completed ? 'bg-emerald-950/20' : q.id === activeQuest?.id ? 'bg-amber-950/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] shrink-0">{q.completed ? '✅' : '🎯'}</span>
                    <span
                      className={`text-[10px] leading-tight truncate ${
                        q.completed
                          ? 'text-gray-500 line-through'
                          : q.id === activeQuest?.id
                            ? 'text-amber-300 font-bold'
                            : 'text-[#e0e0e0]'
                      }`}
                    >
                      {q.titleJa}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-mono ${q.completed ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {q.completed ? '達成済み' : `${q.currentCount}/${q.requiredCount}`}
                    </span>
                    <span className="text-[8px] font-mono text-amber-400/80 whitespace-nowrap">
                      🪙{q.rewardGold} 💎{q.rewardGem}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- RIGHT COMPACT RESOURCE SCAN --- */}
      <div className="absolute right-2 sm:right-4 top-[92px] sm:top-24 flex flex-col items-end gap-1 pointer-events-auto">
        <button
          onClick={() => setShowFullInventory(!showFullInventory)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#121212]/80 border border-[#2a2a2a] text-[8px] uppercase tracking-wider text-gray-400 font-mono hover:text-amber-400 transition-colors cursor-pointer"
        >
          <span>Items</span>
          {showFullInventory ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>

        {visibleItems.map(item => (
          <div
            key={item.id}
            onClick={onOpenCrafting}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#333] text-[#e0e0e0] font-mono text-[10px] font-bold shadow hover:border-amber-500/50 hover:bg-[#222] cursor-pointer active:scale-95 transition-all"
          >
            <span className="text-amber-400 font-mono">{item.count}</span>
            <span className="text-xs">{item.icon}</span>
          </div>
        ))}
      </div>

      {/* --- PINNED RECIPE HUD TRACKER --- */}
      {pinnedRecipe && (
        <div className="w-full flex justify-center pointer-events-auto my-auto">
          <div
            onClick={onOpenCrafting}
            className="px-3 py-1.5 rounded-xl bg-[#121212]/95 backdrop-blur-md border border-[#333] hover:border-amber-500/50 shadow-2xl flex items-center gap-2.5 cursor-pointer transition-all max-w-[340px]"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{pinnedRecipe.icon}</span>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-amber-500 font-bold">Pinned</span>
                <span className="text-[11px] font-serif italic text-[#e0e0e0] truncate max-w-[80px]">{pinnedRecipe.nameJa}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono">
              {pinnedRecipe.inputs.map(input => {
                const available = inventory[input.resource] || 0;
                const enough = available >= input.count;
                const meta = INVENTORY_META[input.resource];
                return (
                  <span
                    key={input.resource}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded border ${
                      enough
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
                        : 'bg-red-950/30 border-red-900/50 text-red-400'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{available}/{input.count}</span>
                  </span>
                );
              })}
            </div>

            {canCraftPinned ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-black uppercase tracking-wider animate-pulse ml-auto">
                Craft
              </span>
            ) : (
              <Pin className="w-3 h-3 text-gray-500 ml-auto" />
            )}
          </div>
        </div>
      )}

      {/* --- BOTTOM CONTROLS & DOCK --- */}
      <div className="w-full flex flex-col gap-1.5 pointer-events-auto mt-auto">
        {/* --- PLACEABLE STRUCTURES QUICK PALETTE (クラフト後の任意タイミング設置バー) --- */}
        {placeableItems.length > 0 && (
          <div className="w-full flex items-center justify-center gap-1.5 px-1 animate-fade-in">
            <div className="px-2 py-1 rounded-xl bg-[#121212]/95 backdrop-blur-md border border-[#333] shadow-2xl flex items-center gap-1.5 max-w-full overflow-x-auto">
              <span className="text-[8px] uppercase tracking-wider font-bold text-amber-400 whitespace-nowrap flex items-center gap-1">
                <span>🔨</span>
                <span>設置:</span>
              </span>
              {placeableItems.map(item => (
                <button
                  key={item.type}
                  onClick={() => onPlaceStructure && onPlaceStructure(item.type)}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold shadow flex items-center gap-1 active:scale-90 transition-all cursor-pointer ${item.color}`}
                  title={`${item.name}を目の前に設置する`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="truncate max-w-[80px] sm:max-w-none">{item.name}</span>
                  <span className="px-1 py-0.2 rounded-full bg-black/50 text-[9px] font-mono">
                    x{item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Menu Dock */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            {/* Fabricator 3D Crafting Button */}
            <button
              id="crafting-codex-btn"
              onClick={onOpenCrafting}
              className="px-2 py-1.5 rounded-xl bg-[#161616]/95 hover:bg-[#222] active:scale-95 text-[#e0e0e0] border border-cyan-500/60 hover:border-cyan-400 shadow-xl flex items-center gap-1 transition-all cursor-pointer group"
            >
              <Hammer className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">工作機</span>
            </button>

            {/* Enemy Codex / Bestiary Button */}
            <button
              id="enemy-library-btn"
              onClick={onOpenEnemyLibrary}
              className="px-2 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-amber-500/40 hover:border-amber-400 shadow-xl flex items-center gap-1 transition-all cursor-pointer group"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                図鑑({discoveredEnemyCount}/5)
              </span>
            </button>

            {/* Safehouse Shelter Button */}
            <button
              id="safehouse-btn"
              onClick={onOpenSafehouse}
              className="px-2 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-[#333] hover:border-amber-500/50 shadow-xl flex items-center gap-1 transition-all cursor-pointer group"
            >
              <Home className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-amber-400">拠点</span>
            </button>

            {/* Backpack Inventory Button */}
            <button
              id="backpack-btn"
              onClick={onOpenInventory}
              className="px-2 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-[#333] hover:border-amber-500/50 shadow-xl flex items-center gap-1 transition-all cursor-pointer group"
            >
              <Backpack className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-amber-400">持物</span>
            </button>
          </div>

          {/* Quick Heal Button */}
          {inventory.stew > 0 && (
            <button
              id="quick-eat-btn"
              onClick={onQuickEat}
              className="px-2 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 active:scale-95 text-emerald-300 text-[10px] font-bold border border-emerald-700/60 shadow-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🍲</span>
              <span className="font-mono">回復({inventory.stew})</span>
            </button>
          )}
        </div>

        {/* Lower Controls: Left Joystick + Right Action & Ink Controls */}
        <div className="w-full flex items-end justify-between px-1 pb-1">
          {/* Left Thumb: Virtual Joystick */}
          <div className="flex items-center justify-start">
            <VirtualJoystick onMove={onMove} onAttack={onAttack} />
          </div>

          {/* Right Thumb: Dual Actions (Ink Blaster + Melee Attack Action) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Splatoon-like Ink Blaster Button with Tank Gauge */}
            <div className="flex flex-col items-center">
              {/* Vertical Ink Tank Meter */}
              <div className="w-8 h-2 rounded-full bg-slate-900 border border-slate-700 overflow-hidden mb-1 shadow-inner">
                <div
                  className="h-full transition-all duration-150 bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  style={{ width: `${inkPercent}%` }}
                />
              </div>

              <button
                id="ink-shoot-btn"
                onClick={onShootInk}
                disabled={player.ink < 15}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 shadow-lg flex flex-col items-center justify-center transition-transform active:scale-90 select-none touch-none ${
                  player.ink >= 15
                    ? 'bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-cyan-400 text-white border-white/80 shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Droplets className="w-5 h-5 text-white" />
                <span className="text-[8px] font-black uppercase tracking-wider">INK</span>
              </button>
            </div>

            {/* Action Melee Attack / Harvest Button */}
            <button
              id="action-attack-btn"
              onPointerDown={() => onAttack(true)}
              onPointerUp={() => onAttack(false)}
              onPointerLeave={() => onAttack(false)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-400 active:scale-90 text-black font-black border-2 border-amber-300/70 shadow-[0_0_25px_rgba(217,119,6,0.5)] flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none"
            >
              <Sword className="w-6 h-6 text-stone-950" />
              <span className="text-[9px] font-black tracking-widest uppercase text-stone-950 mt-0.5">ACTION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
