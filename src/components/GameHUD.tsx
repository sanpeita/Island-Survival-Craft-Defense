import React, { useState } from 'react';
import { ResourceType } from '../types/game';
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
}) => {
  const { player, time, inventory, safehouse, quests, activeQuestId, pinnedRecipeId, isNearFabricator, saveNotification, enemyLibrary } = gameState;
  const isSoundActive = sounds.isEnabled();
  const [showFullInventory, setShowFullInventory] = useState(false);

  const activeQuest = quests.find(q => q.id === activeQuestId) || quests[0];
  const pinnedRecipe = CRAFTING_RECIPES.find(r => r.id === pinnedRecipeId);

  const canCraftPinned = pinnedRecipe
    ? pinnedRecipe.inputs.every(i => (inventory[i.resource] || 0) >= i.count)
    : false;

  const hpPercent = Math.round((player.stats.hp / player.stats.maxHp) * 100);
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

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 select-none z-10 overflow-hidden font-sans safe-top safe-bottom safe-left safe-right">
      {/* --- TOP ROW (Dynamic Island & Status) --- */}
      <div className="w-full flex items-start justify-between gap-1.5 pointer-events-auto">
        {/* Top Left: Base Level & Player HP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#121212]/90 backdrop-blur-md border border-[#333] shadow-2xl">
            {/* Safehouse Status */}
            <div
              onClick={onOpenSafehouse}
              className="flex flex-col cursor-pointer group"
            >
              <span className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Camp
              </span>
              <span className="text-[11px] font-mono font-bold text-[#e0e0e0] group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                Lv.{safehouse.level}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-[#333]" />

            {/* Vitals Meter */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border border-red-900/60 flex items-center justify-center bg-red-950/40 text-red-500 text-[9px] font-bold shadow-inner">
                ❤
              </div>
              <div className="flex flex-col w-16 sm:w-20">
                <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono">
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
          </div>

          {/* Near Fabricator Indicator */}
          {isNearFabricator && (
            <div
              onClick={onOpenCrafting}
              className="px-2 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all animate-bounce"
            >
              <Save className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[9px] font-bold text-cyan-300">3D万能ファブリケーター (セーブ/工作)</span>
            </div>
          )}
        </div>

        {/* Top Center: Time of Day & Currency */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-[#121212]/90 backdrop-blur-md border border-[#333] shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">DAY</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#e0e0e0] leading-none">
                {String(time.dayCount).padStart(2, '0')}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-[#333]" />

            <div className="flex flex-col min-w-[70px] sm:min-w-[90px]">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-wider">
                <span className="text-gray-400 font-medium truncate max-w-[50px] sm:max-w-none">
                  {time.phase === 'day' && 'Day'}
                  {time.phase === 'sunset' && 'Sunset'}
                  {time.phase === 'night' && 'Night'}
                  {time.phase === 'sunrise' && 'Dawn'}
                </span>
                <span className={`font-mono font-bold ${time.phase === 'night' ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
                  {timeFormatted}
                </span>
              </div>
              <div className="w-full h-1 bg-[#222] rounded-full mt-0.5 overflow-hidden border border-[#333]/50">
                <div
                  className={`h-full transition-all duration-300 ${
                    time.phase === 'night'
                      ? 'bg-gradient-to-r from-red-600 to-purple-600'
                      : 'bg-gradient-to-r from-amber-600 to-orange-400'
                  }`}
                  style={{ width: `${dayProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Currency Pill */}
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#121212]/80 backdrop-blur-md border border-[#2a2a2a] text-[10px] font-mono shadow">
            <span className="text-amber-400 flex items-center gap-0.5 font-bold">
              <span>🪙</span>
              <span>{inventory.gold}</span>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-cyan-400 flex items-center gap-0.5 font-bold">
              <span>💎</span>
              <span>{inventory.gem}</span>
            </span>
          </div>
        </div>

        {/* Top Right: Sound & Help */}
        <div className="flex items-center gap-1">
          <button
            id="toggle-sound-btn"
            onClick={() => sounds.toggleSound()}
            className="w-8 h-8 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 backdrop-blur-md border border-[#333] flex items-center justify-center text-[#e0e0e0] hover:border-amber-500/50 transition-all shadow-lg cursor-pointer"
          >
            {isSoundActive ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>
          <button
            id="help-btn"
            onClick={onOpenHelp}
            className="w-8 h-8 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 backdrop-blur-md border border-[#333] flex items-center justify-center text-[#e0e0e0] hover:border-amber-500/50 transition-all shadow-lg cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* --- AUTO SAVE FLOATING BANNER --- */}
      {saveNotification && (
        <div className="w-full flex justify-center mt-1 pointer-events-none animate-fade-in">
          <div className="px-4 py-1.5 rounded-full bg-cyan-950/95 border border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2">
            <Save className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="text-xs font-bold text-cyan-200">{saveNotification}</span>
          </div>
        </div>
      )}

      {/* --- OBJECTIVE PROMPT --- */}
      {activeQuest && (
        <div className="w-full flex justify-center mt-1 pointer-events-auto">
          <div
            onClick={onOpenCrafting}
            className="group px-3 py-1 bg-[#121212]/95 backdrop-blur-md border border-[#333] hover:border-amber-500/60 rounded-xl shadow-2xl flex items-center gap-2 cursor-pointer active:scale-98 transition-all max-w-[340px]"
          >
            <div className="w-5 h-5 rounded-lg bg-amber-950/40 border border-amber-900/60 flex items-center justify-center text-[10px] text-amber-400 shrink-0">
              🎯
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[8px] uppercase tracking-wider text-amber-500 font-bold leading-tight">
                Objective
              </span>
              <span className="text-[11px] font-serif italic text-[#e0e0e0] leading-tight truncate group-hover:text-amber-300 transition-colors">
                {activeQuest.titleJa} ({activeQuest.currentCount}/{activeQuest.requiredCount})
              </span>
            </div>
            <Search className="w-3 h-3 text-gray-500 ml-auto shrink-0 group-hover:text-amber-400 transition-colors" />
          </div>
        </div>
      )}

      {/* --- RIGHT COMPACT RESOURCE SCAN --- */}
      <div className="absolute right-2.5 sm:right-4 top-20 sm:top-24 flex flex-col items-end gap-1 pointer-events-auto">
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
      <div className="w-full flex flex-col gap-2 pointer-events-auto mt-auto">
        {/* Quick Menu Dock */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {/* Fabricator 3D Crafting Button */}
            <button
              id="crafting-codex-btn"
              onClick={onOpenCrafting}
              className="px-2.5 py-1.5 rounded-xl bg-[#161616]/95 hover:bg-[#222] active:scale-95 text-[#e0e0e0] border border-cyan-500/60 hover:border-cyan-400 shadow-xl flex items-center gap-1.5 transition-all cursor-pointer group"
            >
              <Hammer className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">工作機</span>
            </button>

            {/* Enemy Codex / Bestiary Button */}
            <button
              id="enemy-library-btn"
              onClick={onOpenEnemyLibrary}
              className="px-2.5 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-amber-500/40 hover:border-amber-400 shadow-xl flex items-center gap-1.5 transition-all cursor-pointer group"
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
              className="px-2.5 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-[#333] hover:border-amber-500/50 shadow-xl flex items-center gap-1.5 transition-all cursor-pointer group"
            >
              <Home className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-amber-400">拠点</span>
            </button>

            {/* Backpack Inventory Button */}
            <button
              id="backpack-btn"
              onClick={onOpenInventory}
              className="px-2.5 py-1.5 rounded-xl bg-[#121212]/90 hover:bg-[#1a1a1a] active:scale-95 text-[#e0e0e0] border border-[#333] hover:border-amber-500/50 shadow-xl flex items-center gap-1.5 transition-all cursor-pointer group"
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
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 active:scale-95 text-emerald-300 text-[10px] font-bold border border-emerald-700/60 shadow-lg flex items-center gap-1 transition-all cursor-pointer"
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
          <div className="flex items-center gap-3">
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
                className={`w-14 h-14 rounded-full border-2 shadow-lg flex flex-col items-center justify-center transition-transform active:scale-90 select-none touch-none ${
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
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-400 active:scale-90 text-black font-black border-2 border-amber-300/70 shadow-[0_0_25px_rgba(217,119,6,0.5)] flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none"
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
