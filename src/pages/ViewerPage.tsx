import React, { useState, useMemo } from 'react';
import { GiftBox3D } from '../components/GiftBox3D';
import { RoamingIcons } from '../components/RoamingIcons';
import { BOX_THEMES, type GiftPayload } from '../types';
import { decodeGiftPayload } from '../lib/crypto';
import { playClick } from '../lib/audio';
import { RotateCcw, PlusCircle, Share2, Check, AlertCircle, ArrowRight, Volume2 } from 'lucide-react';

interface ViewerPageProps {
  token: string;
}

export const ViewerPage: React.FC<ViewerPageProps> = ({ token }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Decode the token from URL
  const payload: GiftPayload | null = useMemo(() => {
    return decodeGiftPayload(token);
  }, [token]);

  // If token is invalid or decoding failed
  if (!payload) {
    return (
      <div className="h-[100dvh] min-h-[100dvh] bg-[#0d0f1f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mb-4 shadow-xl">
          <AlertCircle className="text-red-400" size={36} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">선물을 찾을 수 없어요</h2>
        <p className="text-sm text-slate-400 max-w-xs mb-6">
          링크가 올바르지 않거나 만료되었습니다. 새로운 선물을 직접 만들어보세요!
        </p>
        <a
          href="#/"
          onClick={playClick}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-sm shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span>나도 선물 만들기</span>
          <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  const currentTheme = BOX_THEMES[payload.b] || BOX_THEMES['classic-red'];

  const handleReplay = () => {
    playClick();
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`relative h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-gradient-to-b ${currentTheme.bgGradient} flex flex-col items-center justify-between p-3 select-none`}
    >
      {/* Roaming Screen-Bouncing Emojis when opened */}
      <RoamingIcons active={isOpen} mainEmoji={payload.e || '🎁'} />

      {/* Top Floating Badge */}
      <div className="z-30 pt-3 flex flex-col items-center gap-1 shrink-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 shadow-lg">
          <span>🎁</span>
          <span>도착한 선물</span>
        </div>
        {!isOpen && (
          <div className="flex items-center gap-1 text-[11px] text-amber-300/90 bg-amber-500/15 border border-amber-400/20 px-3 py-0.5 rounded-full animate-pulse">
            <Volume2 size={11} />
            <span>볼륨을 켜면 더 재밌어요!</span>
          </div>
        )}
      </div>

      {/* 3D Gift Box Stage (Flex-1 ensures perfect scaling without overflowing mobile) */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center z-10 my-1">
        <GiftBox3D
          text={payload.t}
          subText={payload.s}
          emoji={payload.e}
          themeId={payload.b}
          soundId={payload.snd}
          effectId={payload.fx}
          interactive={!isOpen}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Action Bar (Appears after open) */}
      <div className="z-40 w-full max-w-sm pb-4 px-2 shrink-0 transition-all duration-500">
        {isOpen ? (
          <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Create My Own CTA */}
            <a
              href="#/"
              onClick={playClick}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-sm sm:text-base shadow-2xl shadow-yellow-500/30 flex items-center justify-center gap-2 text-center transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle size={18} />
              <span>나도 비밀 선물 만들기 🎁</span>
            </a>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReplay}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>다시 열기</span>
              </button>

              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>링크 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
