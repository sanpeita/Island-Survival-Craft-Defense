import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Volume2,
  VolumeX,
  Compass,
  Droplets,
  Hammer,
  Shield,
  Clock,
  X,
} from 'lucide-react';
import { getSavedGameSummary, hasSavedGame } from '../game/gameLogic';
import { sounds } from '../audio/soundManager';

interface TitleScreenProps {
  onStartNewGame: () => void;
  onLoadGame: () => void;
  onOpenHelp: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartNewGame,
  onLoadGame,
  onOpenHelp,
}) => {
  const [modalType, setModalType] = useState<'none' | 'new_game' | 'load_game' | 'no_save'>('none');
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.isEnabled());

  const saveSummary = getSavedGameSummary();
  const saveExists = hasSavedGame() && saveSummary !== null;

  const toggleAudio = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
    if (newState) {
      sounds.playCollect();
    }
  };

  const handleOpenNewGameModal = () => {
    sounds.playCollect();
    setModalType('new_game');
  };

  const handleOpenLoadModal = () => {
    sounds.playCollect();
    if (saveExists) {
      setModalType('load_game');
    } else {
      setModalType('no_save');
    }
  };

  const handleConfirmNewGame = () => {
    sounds.playCraftSuccess();
    setModalType('none');
    onStartNewGame();
  };

  const handleConfirmLoad = () => {
    sounds.playCraftSuccess();
    setModalType('none');
    onLoadGame();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 pt-[max(env(safe-area-inset-top,0px),56px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] bg-gradient-to-b from-sky-900/80 via-slate-900/90 to-[#0c121e] backdrop-blur-md select-none text-white overflow-y-auto safe-left safe-right">
      {/* Top Header Row */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider text-sky-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          3D SURVIVAL ISLAND
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white transition-all shadow-lg"
            title="サウンド切替"
          >
            {soundEnabled ? <Volume2 size={18} className="text-amber-300" /> : <VolumeX size={18} className="text-slate-400" />}
          </button>
          <button
            onClick={onOpenHelp}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white transition-all shadow-lg"
            title="遊び方ガイド"
          >
            <HelpCircle size={18} className="text-sky-300" />
          </button>
        </div>
      </div>

      {/* Main Branding Center */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-6">
        {/* Animated Badge */}
        <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-cyan-500/20 to-lime-500/20 border border-white/20 shadow-inner">
          <Droplets size={14} className="text-pink-400" />
          <span className="text-xs font-bold tracking-widest text-pink-300 uppercase">Splash Ink Exploration</span>
          <Sparkles size={14} className="text-lime-300" />
        </div>

        {/* Title Logo */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-sky-200 via-amber-200 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          インク・アイランド
        </h1>
        <p className="text-sm font-medium tracking-wide text-sky-200/90 mt-1">
          〜 孤島の3Dクラフト・サバイバル 〜
        </p>

        {/* Short Features Tag Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-[11px] text-slate-300">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
            <Compass size={12} className="text-sky-400" /> 未踏地開拓
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
            <Hammer size={12} className="text-amber-400" /> 武器＆防衛クラフト
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
            <Shield size={12} className="text-emerald-400" /> 拠点強化
          </span>
        </div>

        {/* Menu Buttons Group */}
        <div className="flex flex-col gap-3.5 w-full max-w-xs mt-8">
          {/* Button 1: さいしょから */}
          <button
            onClick={handleOpenNewGameModal}
            className="group relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] text-white font-bold text-base shadow-[0_8px_24px_rgba(245,158,11,0.4)] border border-amber-300/40 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <RotateCcw size={20} className="text-amber-100 group-hover:rotate-[-45deg] transition-transform duration-300" />
            <span>さいしょから</span>
          </button>

          {/* Button 2: ロードする */}
          <button
            onClick={handleOpenLoadModal}
            className={`group relative w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-xl border flex items-center justify-center gap-3 transition-all cursor-pointer ${
              saveExists
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] text-white border-sky-300/30 shadow-[0_8px_24px_rgba(14,165,233,0.35)]'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/10'
            }`}
          >
            <FolderOpen size={20} className={saveExists ? 'text-sky-200' : 'text-slate-400'} />
            <div className="flex flex-col items-start leading-tight">
              <span>ロードする</span>
              {saveExists && (
                <span className="text-[10px] font-normal text-sky-200 opacity-90">
                  Day {saveSummary?.dayCount} / キャンプLv.{saveSummary?.baseLevel}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Footer Version / Info */}
      <div className="w-full text-center text-[11px] text-slate-400 pointer-events-auto">
        <p>© 2026 Ink Island Survival • Auto-Save Enabled</p>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: 「さいしょから」確認ダイアログ */}
      {/* ======================================================== */}
      {modalType === 'new_game' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#1a2232] border border-amber-500/30 shadow-2xl p-5 text-slate-100 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">最初から始めますか？</h3>
                  <p className="text-xs text-amber-300/80">セーブデータの初期化確認</p>
                </div>
              </div>
              <button
                onClick={() => setModalType('none')}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-950/40 border border-amber-500/20 rounded-2xl p-3.5 text-xs leading-relaxed text-amber-200">
              <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                セーブデータがなくなって最初からスタートします。
              </p>
              <p className="text-slate-300 mt-1">
                これまでの島開拓状況や所持アイテムはリセットされ、1日目の最初からゲームが始まります。本当によろしいですか？
              </p>
            </div>

            {/* If save exists, show details of overwritten data */}
            {saveExists && saveSummary && (
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-[11px] text-slate-400 flex flex-col gap-1">
                <span className="text-slate-500 font-semibold">現在保存されているデータ:</span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>進行状況: Day {saveSummary.dayCount}</span>
                  <span>キャンプ: Lv.{saveSummary.baseLevel}</span>
                  <span>🪙 {saveSummary.gold} / 💎 {saveSummary.gem}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setModalType('none')}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-xs active:scale-95 transition-all text-center"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmNewGame}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-red-500/25 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                最初から開始
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: 「ロードする」確認ダイアログ */}
      {/* ======================================================== */}
      {modalType === 'load_game' && saveSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#162134] border border-sky-500/30 shadow-2xl p-5 text-slate-100 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">データをロードしますか？</h3>
                  <p className="text-xs text-sky-300/80">冒険の再開確認</p>
                </div>
              </div>
              <button
                onClick={() => setModalType('none')}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Confirmation prompt */}
            <p className="text-xs text-slate-300 leading-relaxed">
              保存されている以下の記録から冒険を再開します。よろしいですか？
            </p>

            {/* Save Summary Card */}
            <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Clock size={14} /> DAY {saveSummary.dayCount}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/20">
                  Lv.{saveSummary.baseLevel} {saveSummary.tierNameJa}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs text-slate-200">
                <span className="flex items-center gap-1">🪙 {saveSummary.gold} ゴールド</span>
                <span className="flex items-center gap-1">💎 {saveSummary.gem} ジェム</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setModalType('none')}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-xs active:scale-95 transition-all text-center"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmLoad}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                ロードして再開
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: 「セーブデータなし」警告ダイアログ */}
      {/* ======================================================== */}
      {modalType === 'no_save' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#1c222e] border border-white/15 shadow-2xl p-5 text-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">セーブデータがありません</h3>
                <p className="text-xs text-slate-400">データが見つかりませんでした</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/30 rounded-2xl p-3 border border-white/5">
              保存されている冒険データがありません。「さいしょから」を選択して新たなサバイバルを始めてください。
            </p>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setModalType('none')}
                className="w-full py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs active:scale-95 transition-all text-center"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
