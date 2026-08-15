import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EnemyType, EnemyLibraryEntry, ResourceType } from '../types/game';
import { INVENTORY_META } from '../game/gameLogic';
import { BookOpen, Shield, Sword, Zap, MapPin, Award, X, Sparkles, AlertTriangle, Eye, Lock } from 'lucide-react';

interface EnemyLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enemyLibrary: Record<EnemyType, EnemyLibraryEntry>;
}

export const EnemyLibraryModal: React.FC<EnemyLibraryModalProps> = ({
  isOpen,
  onClose,
  enemyLibrary,
}) => {
  const [selectedType, setSelectedType] = useState<EnemyType>('goblin');

  if (!isOpen) return null;

  const entries: EnemyLibraryEntry[] = Object.values(enemyLibrary);
  const selectedEntry = enemyLibrary[selectedType];
  const discoveredCount = entries.filter((e) => e.damaged).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 pt-[max(env(safe-area-inset-top,0px),58px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg max-h-[80dvh] flex flex-col bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl text-slate-200 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-[#1e293b] bg-[#1e293b]/70 shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                  島嶼性生物図鑑
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    {discoveredCount}/{entries.length}
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400">ダメージを与えた敵の生態・弱点データ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <X className="w-3.5 h-3.5 text-red-300" />
              <span>閉じる</span>
            </button>
          </div>

          {/* Monster Selector Horizontal List */}
          <div className="px-4 py-3 bg-[#0a0f1d] border-b border-[#1e293b] overflow-x-auto no-scrollbar flex space-x-2">
            {entries.map((entry) => {
              const isSelected = entry.type === selectedType;
              const isDiscovered = entry.damaged;

              return (
                <button
                  key={entry.type}
                  onClick={() => setSelectedType(entry.type)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md'
                      : isDiscovered
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-900/80 border-dashed border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-sm">
                    {isDiscovered
                      ? entry.type === 'boss_golem'
                        ? '🗿'
                        : entry.type === 'shadow_beast'
                        ? '🐾'
                        : entry.type === 'poison_slime'
                        ? '🧪'
                        : entry.type === 'skeleton'
                        ? '💀'
                        : '🟢'
                      : '❓'}
                  </span>
                  <span>{isDiscovered ? entry.nameJa.split(' ')[0] : '未確認'}</span>
                  {entry.damaged && entry.defeatedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                      x{entry.defeatedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedEntry.damaged ? (
              <div className="space-y-4">
                {/* Profile Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {selectedEntry.type === 'boss_golem'
                            ? '🗿'
                            : selectedEntry.type === 'shadow_beast'
                            ? '🐾'
                            : selectedEntry.type === 'poison_slime'
                            ? '🧪'
                            : selectedEntry.type === 'skeleton'
                            ? '💀'
                            : '🟢'}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-100">{selectedEntry.nameJa}</h3>
                          <p className="text-xs font-mono text-slate-400">{selectedEntry.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Threat Stars */}
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-slate-400 uppercase font-mono">Threat Level</span>
                      <div className="flex text-amber-400 text-sm">
                        {'★'.repeat(selectedEntry.threatLevel)}
                        <span className="text-slate-600">{'★'.repeat(5 - selectedEntry.threatLevel)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{selectedEntry.descriptionJa}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col items-center justify-center text-center">
                    <div className="text-red-400 mb-1 flex items-center gap-1 text-xs">
                      <Shield className="w-3.5 h-3.5" /> HP
                    </div>
                    <span className="text-base font-mono font-bold text-slate-100">{selectedEntry.hp}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col items-center justify-center text-center">
                    <div className="text-amber-400 mb-1 flex items-center gap-1 text-xs">
                      <Sword className="w-3.5 h-3.5" /> 攻撃力
                    </div>
                    <span className="text-base font-mono font-bold text-slate-100">{selectedEntry.damage}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col items-center justify-center text-center">
                    <div className="text-emerald-400 mb-1 flex items-center gap-1 text-xs">
                      <Zap className="w-3.5 h-3.5" /> 移動速度
                    </div>
                    <span className="text-base font-mono font-bold text-slate-100">{selectedEntry.speed} m/s</span>
                  </div>
                </div>

                {/* Tactical Guide & Weakness */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>弱点 & 推奨撃破戦術</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed font-sans">{selectedEntry.weaknessJa}</p>
                </div>

                {/* Habitat & Defeated Count */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" /> 出現エリア
                    </span>
                    <span className="text-slate-200 font-medium">{selectedEntry.habitatJa}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1 mb-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> 討伐実績
                    </span>
                    <span className="text-slate-200 font-mono font-bold text-sm">
                      {selectedEntry.defeatedCount} 体 撃破
                    </span>
                  </div>
                </div>

                {/* Drop Materials */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-xs text-slate-400 block mb-2 font-medium">ドロップ可能物資 (Loot)</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.dropItems.map((item) => {
                      const meta = INVENTORY_META[item as ResourceType];
                      return (
                        <div
                          key={item}
                          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                        >
                          <span>{meta?.icon || '📦'}</span>
                          <span className="text-slate-200">{meta?.nameJa || item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Undiscovered / Undamaged Silhouette View */
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-800/80 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-300">??? [未確認の島嶼生物]</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    この生物にはまだ攻撃を与えていません。インク弾または近接武器でダメージを与えると、詳細な弱点と生態データが図鑑に登録されます。
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>未踏領域や夜間襲撃で遭遇可能</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
