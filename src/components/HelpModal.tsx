import React from 'react';
import { X, Sun, Moon, Hammer, Compass } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 pt-[max(env(safe-area-inset-top,0px),58px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="help-modal-container"
        className="relative w-full max-w-md bg-[#0c0c0c] border border-[#333] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[80vh] max-h-[80dvh] text-[#e0e0e0]"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none dark-dot-grid" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#121212] border-b border-[#2a2a2a] relative z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#1a1a1a] border border-amber-600/40 flex items-center justify-center text-base sm:text-lg shadow-inner">
              📖
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-500 font-bold">Manual</span>
              <h2 className="text-xs sm:text-base font-serif italic text-[#e0e0e0]">Survival Field Guide</h2>
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-3.5 overflow-y-auto max-h-[72vh] max-h-[72dvh] text-xs text-gray-300 relative z-10">
          {/* Section 1: Morning Gathering */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              1. 昼のフェーズ (資材集めと準備)
            </h4>
            <p className="leading-relaxed text-gray-400">
              ヤシの木に近づいて攻撃ボタン(またはSpace)を押すと<strong className="text-gray-200">木材・ヤシの葉・ココナッツ</strong>を伐採できます。岩からは<strong className="text-gray-200">石材</strong>、農地からは<strong className="text-gray-200">パンプキン</strong>を収穫できます。
            </p>
          </div>

          {/* Section 2: Crafting & Safehouse */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              2. 直感的なクラフト管理 & 拠点強化
            </h4>
            <p className="leading-relaxed text-gray-400">
              画面左下の「クラフト」からレシピを確認し、<strong className="text-gray-200">目標のレシピをピン留め</strong>するとHUDで素材進捗をリアルタイム追跡できます。セーフハウスを強化すると新しい上位レシピが解放されます。
            </p>
          </div>

          {/* Section 3: Night Raid Defense */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
            <h4 className="font-bold text-red-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              3. 夜のフェーズ (夜間襲撃と防衛)
            </h4>
            <p className="leading-relaxed text-gray-400">
              夜になると怪物がセーフハウスを目指して侵攻してきます！
              <strong className="text-gray-200">自動クロスボウ砲台</strong>や<strong className="text-gray-200">バリケード</strong>を配置し、自身も剣で応戦して拠点と自身のHPを守り抜いてください。
            </p>
          </div>

          {/* Section 4: Survival Victory & Island Escape */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              4. 夜明けの報酬と島脱出目標
            </h4>
            <p className="leading-relaxed text-gray-400">
              夜を生き延びると朝を迎えて大量のゴールドとジェムを獲得！高台に階段を架けて鉄鉱石を掘り出し、最終目標である<strong className="text-gray-200">「脱出の巨大狼煙」</strong>を完成させましょう！
            </p>
          </div>

          {/* Controls Table */}
          <div className="p-3 rounded-xl bg-[#101010] border border-[#222] space-y-1.5">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">操作方法 (Controls)</h5>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400 font-mono">
              <div>📱 画面ジョイスティック: 移動</div>
              <div>⌨️ WASD / 矢印キー: 移動</div>
              <div>⚔️ ACTIONボタン / Space: 攻撃・採集</div>
              <div>🍲 食事ボタン: HP回復</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121212] border-t border-[#222] relative z-10">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs uppercase tracking-widest text-black shadow-lg cursor-pointer transition-all active:scale-98"
          >
            手引きを閉じる (ゲームに戻る)
          </button>
        </div>
      </div>
    </div>
  );
};

