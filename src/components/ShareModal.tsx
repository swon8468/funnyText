import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Share2, QrCode, X, ExternalLink, MessageCircle } from 'lucide-react';
import { playClick } from '../lib/audio';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  previewText: string;
  themeColor: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  previewText,
  themeColor,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleNativeShare = async () => {
    playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🎁 선물이 도착했습니다!',
          text: '눌러서 선물상자를 열어보세요 🎁',
          url: shareUrl,
        });
      } catch (err) {
        // Share cancelled or not supported
        console.log('Share dismissed', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#16192b] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-black text-3xl mb-3 shadow-lg shadow-yellow-500/20">
            🎁
          </div>
          <h3 className="text-xl font-bold text-white">비밀 선물 링크 완성!</h3>
          <p className="text-sm text-slate-400 mt-1">
            URL에 메시지가 노출되지 않아 완벽한 깜짝 선물이 됩니다.
          </p>
        </div>

        {/* KakaoTalk Preview Simulation */}
        <div className="mb-5 bg-[#20243d] rounded-2xl p-3.5 border border-white/10">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageCircle size={14} className="text-yellow-400" />
              <span>공유 시 상대방에게 보이는 화면</span>
            </span>
            <span className="text-[10px] text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
              스포일러 0%
            </span>
          </div>
          <div className="bg-[#121424] rounded-xl p-3 border border-white/5 flex gap-3 items-center">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 border border-white/15"
              style={{ backgroundColor: `${themeColor}33` }}
            >
              🎁
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">선물이 도착했습니다!</p>
              <p className="text-xs text-slate-400 truncate">눌러서 선물상자를 열어보세요 🎁</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">{shareUrl}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            내가 담은 비밀 내용: <span className="text-white font-bold">"{previewText}"</span>
          </p>
        </div>

        {/* URL Display & Copy */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            암호화된 비밀 링크
          </label>
          <div className="flex items-center gap-2 bg-[#0c0e1a] border border-white/10 rounded-xl p-2 pl-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-300 font-mono w-full outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>복사됨!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code toggle section */}
        {showQr && qrDataUrl && (
          <div className="mb-5 flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-inner">
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            <p className="text-slate-800 text-xs font-bold mt-2">카메라로 스캔하면 바로 열립니다</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              playClick();
              setShowQr(!showQr);
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold transition-all active:scale-98"
          >
            <QrCode size={16} />
            <span>{showQr ? 'QR 닫기' : 'QR 코드'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-yellow-500/25 transition-all active:scale-98"
          >
            <Share2 size={16} />
            <span>공유하기</span>
          </button>
        </div>

        {/* Test Open Directly */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={playClick}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>직접 열어서 확인해보기</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
