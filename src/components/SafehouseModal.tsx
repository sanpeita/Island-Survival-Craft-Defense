import React from 'react';
import { SafehouseState, ResourceType } from '../types/game';
import { INVENTORY_META } from '../game/gameLogic';
import { sounds } from '../audio/soundManager';
import { X, Shield, Wrench, Sparkles, ArrowUpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SafehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  safehouse: SafehouseState;
  inventory: Record<ResourceType, number>;
  onRepair: (costWood: number, costStone: number) => void;
  onUpgrade: () => void;
}

export const SafehouseModal: React.FC<SafehouseModalProps> = ({
  isOpen,
  onClose,
  safehouse,
  inventory,
  onRepair,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const repairWoodCost = 10;
  const repairStoneCost = 6;
  const canRepair = (inventory.wood || 0) >= repairWoodCost && (inventory.stone || 0) >= repairStoneCost && safehouse.hp < safehouse.maxHp;

  // Upgrade costs depending on current level
  let upgradeReqs: { resource: ResourceType; count: number }[] = [];
  if (safehouse.level === 1) {
    upgradeReqs = [
      { resource: 'wood', count: 25 },
      { resource: 'leaf', count: 15 },
      { resource: 'rope', count: 3 },
    ];
  } else if (safehouse.level === 2) {
    upgradeReqs = [
      { resource: 'wood', count: 40 },
      { resource: 'brick', count: 10 },
      { resource: 'stone', count: 30 },
      { resource: 'rope', count: 6 },
    ];
  } else if (safehouse.level === 3) {
    upgradeReqs = [
      { resource: 'brick', count: 20 },
      { resource: 'wood', count: 60 },
      { resource: 'rope', count: 10 },
      { resource: 'stone', count: 50 },
    ];
  }

  const canUpgrade =
    safehouse.level < 4 &&
    upgradeReqs.every(req => (inventory[req.resource] || 0) >= req.count);

  const handleUpgradeClick = () => {
    if (!canUpgrade) return;
    sounds.playUpgrade();
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    onUpgrade();
  };

  const handleRepairClick = () => {
    if (!canRepair) return;
    sounds.playCraftSuccess();
    onRepair(repairWoodCost, repairStoneCost);
  };

  const hpPercent = Math.round((safehouse.hp / safehouse.maxHp) * 100);

  return (
    <div
      id="safehouse-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 pt-[max(env(safe-area-inset-top,0px),58px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="safehouse-modal-container"
        className="relative w-full max-w-lg bg-[#0c0c0c] border border-[#333] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[80vh] max-h-[80dvh] text-[#e0e0e0]"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none dark-dot-grid" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#121212] border-b border-[#2a2a2a] relative z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#1a1a1a] border border-amber-600/40 flex items-center justify-center text-base sm:text-lg shadow-inner">
              🏰
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-500 font-bold">Base Management</span>
              <h2 className="text-xs sm:text-base font-serif italic text-[#e0e0e0] flex items-center gap-1.5 sm:gap-2">
                {safehouse.tierNameJa}
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono not-italic">
                  Lv.{safehouse.level}
                </span>
              </h2>
            </div>
          </div>
          <button
            id="close-safehouse-modal-btn"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <X className="w-3.5 h-3.5 text-red-300" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto max-h-[75vh] max-h-[75dvh] relative z-10">
          {/* Health & Shield Meter */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300 flex items-center gap-1.5 font-serif italic">
                <Shield className="w-4 h-4 text-amber-500" />
                拠点耐久値 (Base HP)
              </span>
              <span className="font-mono font-bold text-amber-400">
                {safehouse.hp} / {safehouse.maxHp} ({hpPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden border border-[#333]/50">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  hpPercent > 50 ? 'bg-gradient-to-r from-emerald-600 to-amber-500' : hpPercent > 20 ? 'bg-amber-600' : 'bg-red-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Repair Button */}
            <div className="pt-2 flex items-center justify-between border-t border-[#222] mt-2">
              <div className="text-[11px] text-gray-400">
                修理コスト: 🪵 {repairWoodCost}, 🪨 {repairStoneCost}
              </div>
              <button
                id="repair-safehouse-btn"
                onClick={handleRepairClick}
                disabled={!canRepair}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  canRepair
                    ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 shadow'
                    : 'bg-[#1a1a1a] text-gray-600 border border-[#2a2a2a] cursor-not-allowed'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>拠点を修復</span>
              </button>
            </div>
          </div>

          {/* Defense Perks */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-2 text-xs">
            <h4 className="text-[10px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>現在の拠点防衛効果</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#252525] text-[11px]">
                <div className="text-gray-400">砲台スロット</div>
                <div className="font-bold font-mono text-amber-400 text-sm">{safehouse.turretSlots} 箇所</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#252525] text-[11px]">
                <div className="text-gray-400">夜間自動修復</div>
                <div className="font-bold font-mono text-emerald-400 text-sm">+{safehouse.autoHealRate * 10} HP / 朝</div>
              </div>
            </div>
          </div>

          {/* Upgrade Section */}
          {safehouse.level < 4 ? (
            <div className="p-4 rounded-xl bg-[#161616] border border-amber-600/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4" />
                  UPGRADE LEVEL {safehouse.level + 1}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                  HP+200 / スロット+1
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {upgradeReqs.map(req => {
                  const meta = INVENTORY_META[req.resource];
                  const available = inventory[req.resource] || 0;
                  const enough = available >= req.count;

                  return (
                    <div
                      key={req.resource}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                        enough ? 'bg-[#1b1b1b] border-[#2c2c2c]' : 'bg-red-950/20 border-red-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{meta.icon}</span>
                        <span className="text-gray-300">{meta.nameJa}</span>
                      </div>
                      <span className={`font-mono font-bold ${enough ? 'text-green-400' : 'text-red-400'}`}>
                        {available}/{req.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                id="upgrade-safehouse-btn"
                onClick={handleUpgradeClick}
                disabled={!canUpgrade}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canUpgrade
                    ? 'bg-amber-600 hover:bg-amber-500 active:scale-98 text-black shadow-lg'
                    : 'bg-[#222] text-gray-600 border border-[#333] cursor-not-allowed'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>拠点を増築する (Lv.{safehouse.level + 1})</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/40 text-center text-xs text-amber-300 font-serif italic">
              🏰 孤島の城塞 (最大レベル到達済み)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

