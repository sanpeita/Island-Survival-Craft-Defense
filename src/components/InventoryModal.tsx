import React from 'react';
import { ResourceType } from '../types/game';
import { INVENTORY_META, MAX_ITEM_CAPACITY } from '../game/gameLogic';
import { sounds } from '../audio/soundManager';
import { X, Utensils, Sparkles } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<ResourceType, number>;
  onEatFood: (foodType: 'stew' | 'coconut' | 'pumpkin') => void;
  onOpenCrafting: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onEatFood,
  onOpenCrafting,
}) => {
  if (!isOpen) return null;

  const items = Object.keys(INVENTORY_META) as ResourceType[];

  const handleEat = (res: ResourceType) => {
    if (res === 'stew' || res === 'coconut' || res === 'pumpkin') {
      if ((inventory[res] || 0) > 0) {
        sounds.playEat();
        onEatFood(res);
      }
    }
  };

  return (
    <div
      id="inventory-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 pt-[max(env(safe-area-inset-top,0px),58px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="inventory-modal-container"
        className="relative w-full max-w-md bg-[#0c0c0c] border border-[#333] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[80vh] max-h-[80dvh] text-[#e0e0e0]"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none dark-dot-grid" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#121212] border-b border-[#2a2a2a] relative z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#1a1a1a] border border-amber-600/40 flex items-center justify-center text-base sm:text-lg shadow-inner">
              🎒
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-500 font-bold">Storage</span>
              <h2 className="text-xs sm:text-base font-serif italic text-[#e0e0e0]">Backpack & Provisions</h2>
            </div>
          </div>
          <button
            id="close-inventory-modal-btn"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <X className="w-3.5 h-3.5 text-red-300" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Items Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[65vh] max-h-[65dvh] space-y-3 relative z-10">
          <div className="grid grid-cols-2 gap-2.5">
            {items.map(resId => {
              const meta = INVENTORY_META[resId];
              const count = inventory[resId] || 0;
              const maxCap = MAX_ITEM_CAPACITY[resId] ?? 999;
              const isFull = count >= maxCap;
              const isFood = resId === 'stew' || resId === 'coconut' || resId === 'pumpkin';

              return (
                <div
                  key={resId}
                  className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between hover:border-[#383838] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-xl">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#e0e0e0]">{meta.nameJa}</div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-500">{meta.category}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-mono font-bold text-sm ${isFull ? 'text-red-400' : 'text-amber-400'}`}>
                      {count}/{maxCap}
                    </span>
                    {isFood && count > 0 && (
                      <button
                        onClick={() => handleEat(resId)}
                        className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-[9px] font-bold text-emerald-300 border border-emerald-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Utensils className="w-2.5 h-2.5" />
                        <span>食べる</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121212] border-t border-[#222] flex gap-2 relative z-10">
          <button
            onClick={() => {
              onClose();
              onOpenCrafting();
            }}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs uppercase tracking-widest text-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>クラフト画面を開く</span>
          </button>
        </div>
      </div>
    </div>
  );
};

