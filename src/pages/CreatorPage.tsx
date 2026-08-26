import React, { useState } from 'react';
import { Sparkles, RefreshCw, Volume2, Palette, Smile, Send, Wand2 } from 'lucide-react';
import { GiftBox3D } from '../components/GiftBox3D';
import { ShareModal } from '../components/ShareModal';
import {
  BOX_THEMES,
  PRESET_EMOJIS,
  FUNNY_TEMPLATES,
  type BoxThemeId,
  type SoundEffectId,
  type VisualEffectId,
  type GiftPayload,
} from '../types';
import { encodeGiftPayload } from '../lib/crypto';
import { playClick, triggerSoundEffect } from '../lib/audio';
import { triggerVisualEffect } from '../lib/confetti';

export const CreatorPage: React.FC = () => {
  const [text, setText] = useState<string>('난 짬뽕');
  const [subText, setSubText] = useState<string>('탕수육도 사줘 🥢');
  const [selectedTheme, setSelectedTheme] = useState<BoxThemeId>('classic-red');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🍜');
  const [selectedSound, setSelectedSound] = useState<SoundEffectId>('boom');
  const [selectedEffect, setSelectedEffect] = useState<VisualEffectId>('confetti');

  // Preview state
  const [previewIsOpen, setPreviewIsOpen] = useState<boolean>(false);

  // Share Modal state
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  const currentTheme = BOX_THEMES[selectedTheme];

  // Apply template
  const applyTemplate = (template: typeof FUNNY_TEMPLATES[number]) => {
    playClick();
    setText(template.text);
    setSubText(template.sub);
    setSelectedEmoji(template.emoji);
    setSelectedTheme(template.theme as BoxThemeId);
    setSelectedSound(template.sound as SoundEffectId);
    setSelectedEffect(template.fx as VisualEffectId);
    setPreviewIsOpen(false);
  };

  // Generate URL
  const handleGenerateLink = () => {
    playClick();
    const payload: GiftPayload = {
      v: 1,
      t: text.trim() || '선물이 도착했어요!',
      s: subText.trim() || undefined,
      b: selectedTheme,
      e: selectedEmoji,
      snd: selectedSound,
      fx: selectedEffect,
      ts: Date.now(),
    };

    const token = encodeGiftPayload(payload);
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}#/v/${token}`;

    setGeneratedUrl(fullUrl);
    setShareModalOpen(true);
  };

  const handleSoundSelect = (sndId: SoundEffectId) => {
    setSelectedSound(sndId);
    triggerSoundEffect(sndId);
  };

  const handleEffectSelect = (fxId: VisualEffectId) => {
    setSelectedEffect(fxId);
    triggerVisualEffect(fxId);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentTheme.bgGradient} text-white transition-colors duration-500 pb-28 lg:pb-12`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/40 border-b border-white/10 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-xl shadow-lg shadow-red-500/20">
              🎁
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                funnyText
              </h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">3D 비밀 선물상자 생성기</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🔒 DB 없이 100% 암호화
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Preset Templates Carousel / Bar */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={16} className="text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              인기 밈 & 빠른 템플릿
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FUNNY_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(tmpl)}
                className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all text-xs font-medium active:scale-95"
              >
                <span>{tmpl.emoji}</span>
                <span className="text-slate-200 font-semibold">{tmpl.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Two-column Layout: Controls (Left) & 3D Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Settings Editor (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Message Input Box */}
            <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span>숨겨둘 비밀 답변/메시지</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {text.length}/50
                </span>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={50}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setPreviewIsOpen(false);
                  }}
                  placeholder="예: 난 짬뽕 / 돈 갚아라 / 비밀이야"
                  className="w-full bg-white/5 border border-white/15 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-lg font-bold text-white placeholder:text-slate-500 outline-none transition-all focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              {/* Subtext */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  추가 메시지 / 보낸 사람 (선택)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={subText}
                  onChange={(e) => {
                    setSubText(e.target.value);
                    setPreviewIsOpen(false);
                  }}
                  placeholder="예: 탕수육도 사줘 / from. OO"
                  className="w-full bg-white/5 border border-white/10 focus:border-amber-400/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* 2. Theme Selection */}
            <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Palette size={16} className="text-pink-400" />
                <span>선물상자 테마</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {Object.values(BOX_THEMES).map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        playClick();
                        setSelectedTheme(theme.id);
                      }}
                      className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-white bg-white/20 shadow-lg scale-105'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: theme.boxColor }}
                      >
                        <div
                          className="w-2.5 h-full absolute"
                          style={{ backgroundColor: theme.ribbonColor }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-200 text-center leading-tight truncate w-full">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Emoji Selection */}
            <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Smile size={16} className="text-amber-400" />
                <span>등장 이모지 / 아이콘</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {PRESET_EMOJIS.map((em) => {
                  const isSelected = selectedEmoji === em;
                  return (
                    <button
                      key={em}
                      onClick={() => {
                        playClick();
                        setSelectedEmoji(em);
                      }}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-400/30 border-2 border-amber-400 scale-110 shadow-md'
                          : 'bg-white/5 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      {em}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sound & Visual Effect */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sound */}
              <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Volume2 size={15} className="text-cyan-400" />
                  <span>효과음</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'boom', label: '💥 808 붐' },
                    { id: 'fanfare', label: '🎺 팡파레' },
                    { id: 'tada', label: '✨ 짜잔' },
                    { id: 'drumroll', label: '🥁 드럼롤' },
                  ].map((snd) => (
                    <button
                      key={snd.id}
                      onClick={() => handleSoundSelect(snd.id as SoundEffectId)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        selectedSound === snd.id
                          ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                      }`}
                    >
                      {snd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Effect */}
              <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={15} className="text-purple-400" />
                  <span>파티클 효과</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'confetti', label: '🎉 폭죽' },
                    { id: 'money', label: '💸 돈다발' },
                    { id: 'hearts', label: '❤️ 하트' },
                    { id: 'fireworks', label: '🎆 불꽃' },
                  ].map((fx) => (
                    <button
                      key={fx.id}
                      onClick={() => handleEffectSelect(fx.id as VisualEffectId)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        selectedEffect === fx.id
                          ? 'bg-purple-500/30 border border-purple-400 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                      }`}
                    >
                      {fx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live 3D Preview (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 tracking-wider">
                    실시간 3D 미리보기
                  </span>
                </div>

                {previewIsOpen && (
                  <button
                    onClick={() => {
                      playClick();
                      setPreviewIsOpen(false);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all"
                  >
                    <RefreshCw size={12} />
                    <span>상자 닫기</span>
                  </button>
                )}
              </div>

              {/* 3D Canvas Box */}
              <div className="h-[360px] sm:h-[400px] w-full relative rounded-2xl overflow-hidden bg-black/20">
                <GiftBox3D
                  text={text || '선물상자'}
                  subText={subText}
                  emoji={selectedEmoji}
                  themeId={selectedTheme}
                  soundId={selectedSound}
                  effectId={selectedEffect}
                  interactive={true}
                  isOpen={previewIsOpen}
                  onOpenChange={setPreviewIsOpen}
                  className="w-full h-full"
                />
              </div>

              <p className="text-center text-xs text-slate-400 mt-3">
                {previewIsOpen
                  ? '✨ 상자가 열렸습니다! 상자 닫기를 눌러 다시 닫을 수 있습니다.'
                  : '👆 상자를 직접 탭해서 오픈 연출을 테스트해보세요!'}
              </p>
            </div>

            {/* Large Generate Button */}
            <button
              onClick={handleGenerateLink}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-lg shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer hover:shadow-yellow-500/40"
            >
              <Send size={20} />
              <span>비밀 선물 링크 생성하기 🎁</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 lg:hidden z-30">
        <button
          onClick={handleGenerateLink}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-base shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 active:scale-98"
        >
          <Send size={18} />
          <span>비밀 선물 링크 생성하기 🎁</span>
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={generatedUrl}
        previewText={text}
        themeColor={currentTheme.boxColor}
      />
    </div>
  );
};
