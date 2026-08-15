import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isIPhoneFrame, setIsIPhoneFrame] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      // If width > 768px and not touch-only, treat as desktop previewer
      const isLargeScreen = window.innerWidth > 768;
      setIsDesktop(isLargeScreen);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // When played on actual mobile device (e.g. iPhone 16 Safari / GitHub Pages)
  if (!isDesktop) {
    return (
      <div className="w-full h-full h-[100dvh] bg-[#0c0c0c] overflow-hidden select-none relative flex flex-col">
        {children}
      </div>
    );
  }

  // When played on Desktop / Tablet browser (with iPhone 16 Portrait simulation)
  return (
    <div className="w-screen h-screen bg-[#0c0c0c] flex flex-col items-center justify-center overflow-hidden font-sans select-none relative">
      {/* Device View Mode Toggle for Desktop Reviewers */}
      <div className="absolute top-3 left-3 z-40 flex items-center gap-1.5 bg-[#121212]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#333] shadow-2xl">
        <button
          onClick={() => setIsIPhoneFrame(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
            isIPhoneFrame ? 'bg-amber-600 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iPhone 16 (縦持ち)</span>
        </button>
        <button
          onClick={() => setIsIPhoneFrame(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
            !isIPhoneFrame ? 'bg-amber-600 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>全画面表示</span>
        </button>
      </div>

      {/* Main Container */}
      {isIPhoneFrame ? (
        <div className="relative w-[393px] h-[852px] max-h-[96vh] max-w-[96vw] aspect-[393/852] rounded-[48px] border-[8px] border-[#222] shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden bg-black flex flex-col">
          {/* Simulated iPhone 16 Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 pointer-events-none flex items-center justify-between px-3 border border-[#1a1a1a] shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#161616] border border-[#222]" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-950/80 border border-blue-900/50" />
          </div>

          {/* Canvas Content */}
          <div className="relative w-full h-full overflow-hidden flex flex-col">{children}</div>

          {/* Simulated Home Indicator at bottom */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30 pointer-events-none" />
        </div>
      ) : (
        <div className="relative w-full h-full overflow-hidden flex flex-col">{children}</div>
      )}
    </div>
  );
};

