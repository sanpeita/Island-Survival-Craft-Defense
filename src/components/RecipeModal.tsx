import React, { useState } from 'react';
import { CraftingRecipe, ResourceType, RecipeCategory } from '../types/game';
import { CRAFTING_RECIPES } from '../data/recipes';
import { INVENTORY_META } from '../game/gameLogic';
import { sounds } from '../audio/soundManager';
import { X, Search, Pin, CheckCircle2, AlertCircle, Hammer, Sparkles, Shield, Wrench, Utensils, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<ResourceType, number>;
  safehouseLevel: number;
  pinnedRecipeId: string | null;
  isNearFabricator: boolean;
  onPinRecipe: (recipeId: string) => void;
  onCraftRecipe: (recipe: CraftingRecipe, count: number) => void;
}

const CATEGORIES: { id: RecipeCategory | 'all'; name: string; nameJa: string; icon: React.ReactNode }[] = [
  { id: 'all', name: 'All Recipes', nameJa: 'すべて', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'tools', name: 'Tools & Weapons', nameJa: '道具・武器', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'defense', name: 'Defense & Traps', nameJa: '防衛・トラップ', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'building', name: 'Safehouse & Base', nameJa: '拠点・建材', icon: <Hammer className="w-3.5 h-3.5" /> },
  { id: 'food', name: 'Food & Cooking', nameJa: '料理・サバイバル', icon: <Utensils className="w-3.5 h-3.5" /> },
  { id: 'expansion', name: 'Expansion', nameJa: '島拡張・脱出', icon: <Compass className="w-3.5 h-3.5" /> },
];

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  inventory,
  safehouseLevel,
  pinnedRecipeId,
  isNearFabricator,
  onPinRecipe,
  onCraftRecipe,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe>(CRAFTING_RECIPES[0]);

  if (!isOpen) return null;

  const filteredRecipes = CRAFTING_RECIPES.filter(recipe => {
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    const matchesSearch =
      recipe.nameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const canCraft = (recipe: CraftingRecipe) => {
    if (recipe.unlockSafehouseLevel > safehouseLevel) return false;
    for (const input of recipe.inputs) {
      if ((inventory[input.resource] || 0) < input.count) {
        return false;
      }
    }
    return true;
  };

  const getMaxCraftable = (recipe: CraftingRecipe) => {
    if (recipe.unlockSafehouseLevel > safehouseLevel) return 0;
    let max = Infinity;
    for (const input of recipe.inputs) {
      const available = inventory[input.resource] || 0;
      const possible = Math.floor(available / input.count);
      if (possible < max) max = possible;
    }
    return max === Infinity ? 0 : max;
  };

  const handleCraft = (recipe: CraftingRecipe, count: number = 1) => {
    if (!canCraft(recipe) || !isNearFabricator) return;
    sounds.playCraftSuccess();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    onCraftRecipe(recipe, count);
  };

  return (
    <div
      id="recipe-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 pt-[max(env(safe-area-inset-top,0px),58px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="recipe-modal-container"
        className="relative w-full max-w-3xl bg-[#0c0c0c] border border-[#333] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[80vh] max-h-[80dvh] text-[#e0e0e0]"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none dark-dot-grid" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#121212] border-b border-[#2a2a2a] relative z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#1a1a1a] border border-amber-600/40 flex items-center justify-center text-base sm:text-lg shadow-inner">
              ⚒️
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-500 font-bold">Workshop</span>
              <h2 className="text-xs sm:text-base font-serif italic text-[#e0e0e0]">Crafting Recipes & Codex</h2>
            </div>
          </div>
          <button
            id="close-recipe-modal-btn"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <X className="w-3.5 h-3.5 text-red-300" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Search Bar & Categories */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-[#111111] border-b border-[#222] space-y-1.5 sm:space-y-2 relative z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
            <input
              type="text"
              placeholder="レシピや素材を検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-[#181818] border border-[#2a2a2a] rounded-xl text-xs text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap text-[11px] sm:text-xs transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-black font-bold shadow-md'
                    : 'bg-[#181818] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:bg-[#202020]'
                }`}
              >
                {cat.icon}
                <span>{cat.nameJa}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Left List + Right Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-y-auto md:overflow-hidden relative z-10">
          {/* Recipe List (Left) */}
          <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-[#222] overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2 max-h-48 md:max-h-none bg-[#0e0e0e]">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs italic">一致するレシピがありません</div>
            ) : (
              filteredRecipes.map(recipe => {
                const craftable = canCraft(recipe);
                const isSelected = selectedRecipe.id === recipe.id;
                const isPinned = pinnedRecipeId === recipe.id;
                const isLocked = recipe.unlockSafehouseLevel > safehouseLevel;

                return (
                  <div
                    key={recipe.id}
                    id={`recipe-item-${recipe.id}`}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e1e1e] border-amber-600 shadow-md'
                        : 'bg-[#161616] border-[#252525] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-xl relative">
                        {recipe.icon}
                        {isPinned && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">
                            📌
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#e0e0e0]">{recipe.nameJa}</h4>
                          {isLocked && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-900/50 font-mono">
                              要Lv.{recipe.unlockSafehouseLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {recipe.inputs.map(i => {
                            const available = inventory[i.resource] || 0;
                            const hasEnough = available >= i.count;
                            const meta = INVENTORY_META[i.resource];
                            return (
                              <span
                                key={i.resource}
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                  hasEnough
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {meta.icon} {available}/{i.count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {craftable ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          Craft
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#222] text-gray-500 border border-[#333]">
                          Lock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recipe Detail Panel (Right) */}
          <div className="md:col-span-6 p-5 flex flex-col justify-between bg-[#111111] overflow-y-auto">
            {selectedRecipe ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] border border-amber-600/40 flex items-center justify-center text-2xl shadow-inner">
                      {selectedRecipe.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-serif italic text-[#e0e0e0]">{selectedRecipe.nameJa}</h3>
                      <p className="text-[11px] text-gray-400">{selectedRecipe.name}</p>
                    </div>
                  </div>

                  {/* Pin Recipe Button */}
                  <button
                    id={`pin-recipe-${selectedRecipe.id}`}
                    onClick={() => onPinRecipe(selectedRecipe.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pinnedRecipeId === selectedRecipe.id
                        ? 'bg-blue-900/40 border border-blue-600 text-blue-300 shadow-md'
                        : 'bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444]'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{pinnedRecipeId === selectedRecipe.id ? 'ピン留め中' : '目標にピン留め'}</span>
                  </button>
                </div>

                {/* Flavor & Description Box */}
                <div className="p-3 rounded-xl bg-[#161616] border border-[#222]">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
                    Selected Recipe Info
                  </span>
                  <p className="text-xs text-gray-300 italic leading-relaxed">
                    "{selectedRecipe.description}"
                  </p>
                </div>

                {/* Ingredients Requirement Box */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-2">
                    Materials Required (必要素材)
                  </h4>
                  <div className="space-y-2">
                    {selectedRecipe.inputs.map(req => {
                      const meta = INVENTORY_META[req.resource];
                      const available = inventory[req.resource] || 0;
                      const hasEnough = available >= req.count;
                      const progressPct = Math.min(100, Math.round((available / req.count) * 100));

                      return (
                        <div
                          key={req.resource}
                          className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                            hasEnough ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-red-950/20 border-red-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{meta.icon}</span>
                              <span className="font-medium text-[#e0e0e0]">{meta.nameJa}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`font-mono font-bold ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                                {available}
                              </span>
                              <span className="text-gray-500 font-mono">/ {req.count}</span>
                              {hasEnough ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-1" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-1" />
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                hasEnough ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Level Lock Notice */}
                {selectedRecipe.unlockSafehouseLevel > safehouseLevel && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300 flex items-center gap-2">
                    <span className="text-base">🔒</span>
                    <span>セーフハウス Lv.{selectedRecipe.unlockSafehouseLevel} 以上で解放されます</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Craft Actions */}
            {selectedRecipe && (
              <div className="pt-4 border-t border-[#222]">
                {!isNearFabricator && (
                  <div className="mb-3 p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-xs text-cyan-300 flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span>3D万能ファブリケーターに触れていないため、クラフトできません</span>
                  </div>
                )}
                <div className="flex gap-2">
                <button
                  id="craft-single-btn"
                  onClick={() => handleCraft(selectedRecipe, 1)}
                  disabled={!canCraft(selectedRecipe) || !isNearFabricator}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    canCraft(selectedRecipe) && isNearFabricator
                      ? 'bg-amber-600 hover:bg-amber-500 active:scale-98 text-black shadow-lg'
                      : 'bg-[#222] text-gray-500 border border-[#333] cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>作成 (1個)</span>
                </button>

                {getMaxCraftable(selectedRecipe) > 1 && (
                  <button
                    id="craft-max-btn"
                    onClick={() => handleCraft(selectedRecipe, getMaxCraftable(selectedRecipe))}
                    disabled={!canCraft(selectedRecipe) || !isNearFabricator}
                    className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer ${
                      canCraft(selectedRecipe) && isNearFabricator
                        ? 'bg-[#1a1a1a] hover:bg-[#252525] text-amber-400 border border-amber-600/50'
                        : 'bg-[#222] text-gray-500 border border-[#333] cursor-not-allowed'
                    }`}
                  >
                    最大 ({getMaxCraftable(selectedRecipe)})
                  </button>
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

