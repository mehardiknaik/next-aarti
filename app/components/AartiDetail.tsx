'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

export interface AartiItem {
  key: string;
  title: {
    original: string;
    transliteration: string;
  };
  body: {
    original: string;
    transliteration: string;
  };
  metadata: {
    tags: string[];
    slug: string;
  };
}

interface AartiDetailProps {
  aarti: AartiItem;
  prevAarti?: AartiItem | null;
  nextAarti?: AartiItem | null;
}

export default function AartiDetail({ aarti, prevAarti, nextAarti }: AartiDetailProps) {
  const [scriptMode, setScriptMode] = useState<'original' | 'transliteration' | 'both'>('original');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Load saved font size preference
      const savedFontSize = localStorage.getItem('app_font_size');
      if (savedFontSize === 'small') setFontSize('normal');
      else if (savedFontSize === 'medium') setFontSize('normal');
      else if (savedFontSize === 'large') setFontSize('large');
      else if (savedFontSize === 'xlarge') setFontSize('xlarge');

      // Load saved default script
      const savedScript = localStorage.getItem('app_default_script') as 'original' | 'transliteration' | 'both';
      if (savedScript) {
        setScriptMode(savedScript);
      }

      // Load favorite status
      const saved = localStorage.getItem('aarti_favorites');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setIsFavorite(parsed.includes(aarti.key));
      }

      setIsDarkMode(document.documentElement.classList.contains('dark'));
    } catch {
      // ignore
    }
  }, [aarti.key]);

  const triggerHaptic = () => {
    try {
      const hapticsEnabled = localStorage.getItem('app_haptics') !== 'false';
      if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    triggerHaptic();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  };

  const toggleFavorite = () => {
    triggerHaptic();
    try {
      const saved = localStorage.getItem('aarti_favorites');
      const list: string[] = saved ? JSON.parse(saved) : [];
      let updated: string[];
      if (list.includes(aarti.key)) {
        updated = list.filter((k) => k !== aarti.key);
        setIsFavorite(false);
      } else {
        updated = [...list, aarti.key];
        setIsFavorite(true);
      }
      localStorage.setItem('aarti_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    triggerHaptic();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  };

  const copyLyrics = () => {
    triggerHaptic();
    let text = `${aarti.title.original} (${aarti.title.transliteration})\n\n`;
    if (scriptMode === 'original' || scriptMode === 'both') {
      text += `--- मराठी ---\n${aarti.body.original}\n\n`;
    }
    if (scriptMode === 'transliteration' || scriptMode === 'both') {
      text += `--- Transliteration ---\n${aarti.body.transliteration}\n`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fontSizeClass = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-2xl leading-loose',
    xlarge: 'text-xl sm:text-3xl leading-loose',
  }[fontSize];

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-30 ios-glass-nav transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Back Navigation */}
          <Link
            href="/"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium text-sm sm:text-base transition hover:opacity-80 cursor-pointer"
          >
            <span className="material-symbols-rounded text-xl">chevron_left</span>
            <span className="hidden sm:inline">सर्व आरत्या</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Center Badge */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider font-mono">
              आरती #{aarti.key}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              <span className="material-symbols-rounded text-2xl text-amber-500 dark:text-yellow-300">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link
              href="/search"
              onClick={triggerHaptic}
              className="p-2 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title="Voice Search"
            >
              <span className="material-symbols-rounded text-2xl">mic</span>
            </Link>

            <button
              onClick={copyLyrics}
              className={`p-2 rounded-full transition cursor-pointer flex items-center justify-center ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={copied ? 'Copied' : 'Copy lyrics'}
            >
              <span className="material-symbols-rounded text-2xl">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>

            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition cursor-pointer flex items-center justify-center ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={isFavorite ? 'Remove from saved' : 'Save Aarti'}
            >
              <span className="material-symbols-rounded text-2xl">
                {isFavorite ? 'star' : 'star_border'}
              </span>
            </button>

            <Link
              href="/settings"
              onClick={triggerHaptic}
              className="p-2 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="Settings"
            >
              <span className="material-symbols-rounded text-2xl">settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Title Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3 shadow-xs">
          <span className="material-symbols-rounded text-sm">temple_hindu</span>
          <span>आरती #{aarti.key}</span>
          <span>•</span>
          <span className="font-mono">#{aarti.metadata.slug}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
          {aarti.title.original}
        </h1>
        <h2 className="mt-1 text-base sm:text-xl text-[#636366] dark:text-[#AEAEB2] font-medium">
          {aarti.title.transliteration}
        </h2>
      </section>

      {/* Main Aarti Reader */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 space-y-5">
        {/* iOS Frosted Floating Controls (Script & Font Size) */}
        <div className="ios-glass-card rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Script Segmented Control */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="font-semibold text-[#48484A] dark:text-[#AEAEB2] flex items-center gap-1 pl-1">
              <span className="material-symbols-rounded text-base text-orange-500 dark:text-orange-400">translate</span>
              भाषा:
            </span>
            <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/10">
              <button
                onClick={() => {
                  triggerHaptic();
                  setScriptMode('original');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  scriptMode === 'original'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setScriptMode('transliteration');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  scriptMode === 'transliteration'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setScriptMode('both');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  scriptMode === 'both'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                दोन्ही (Both)
              </button>
            </div>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#48484A] dark:text-[#AEAEB2]">
            <span className="font-medium flex items-center gap-1">
              <span className="material-symbols-rounded text-base text-orange-500 dark:text-orange-400">format_size</span>
              आकार:
            </span>
            <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/10">
              <button
                onClick={() => {
                  triggerHaptic();
                  setFontSize('normal');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                लहान
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setFontSize('large');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                मध्यम
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setFontSize('xlarge');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                मोठा
              </button>
            </div>
          </div>
        </div>

        {/* Aarti Lyrics Presentation Card (Frosted Glass Container) */}
        <div className="ios-glass-card rounded-3xl p-6 sm:p-12 shadow-xl">
          {scriptMode === 'both' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 text-left">
              {/* Marathi Original Column */}
              <div className="ios-glass-inset p-6 sm:p-8 rounded-3xl border border-black/5 dark:border-white/10">
                <h3 className="text-xs uppercase tracking-widest text-orange-600 dark:text-orange-400 font-bold mb-6 pb-2 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
                  <span className="material-symbols-rounded text-lg">temple_hindu</span>
                  <span>मराठी मूळ आरती</span>
                </h3>
                <div className={`whitespace-pre-line text-[#1C1C1E] dark:text-[#F2F2F7] font-medium font-devanagari ${fontSizeClass}`}>
                  {aarti.body.original}
                </div>
              </div>

              {/* English Transliteration Column */}
              <div className="ios-glass-inset p-6 sm:p-8 rounded-3xl border border-black/5 dark:border-white/10">
                <h3 className="text-xs uppercase tracking-widest text-orange-600 dark:text-orange-400 font-bold mb-6 pb-2 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
                  <span className="material-symbols-rounded text-lg">menu_book</span>
                  <span>English Transliteration</span>
                </h3>
                <div className={`whitespace-pre-line text-[#3A3A3C] dark:text-[#D1D1D6] font-normal ${fontSizeClass}`}>
                  {aarti.body.transliteration}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 mb-6 shadow-sm">
                <span className="material-symbols-rounded text-3xl">temple_hindu</span>
              </div>
              <div className={`whitespace-pre-line font-medium text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari ${fontSizeClass}`}>
                {scriptMode === 'original' ? aarti.body.original : aarti.body.transliteration}
              </div>
              <div className="mt-12 pt-6 border-t border-black/5 dark:border-white/10 text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-lg">brightness_7</span>
                <span>॥ श्री गजानन प्रसन्न ॥</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pagination Links (iOS Inset Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevAarti ? (
            <Link
              href={`/aarti/${prevAarti.metadata.slug}`}
              onClick={triggerHaptic}
              className="group ios-glass-card hover:scale-[1.01] p-4 sm:p-5 rounded-3xl transition duration-200 flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-xl group-hover:-translate-x-0.5 transition duration-150">arrow_back</span>
              </div>
              <div>
                <div className="text-[10px] text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider font-semibold">मागील आरती / Previous</div>
                <div className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition line-clamp-1 font-devanagari">
                  {prevAarti.title.original}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextAarti ? (
            <Link
              href={`/aarti/${nextAarti.metadata.slug}`}
              onClick={triggerHaptic}
              className="group ios-glass-card hover:scale-[1.01] p-4 sm:p-5 rounded-3xl transition duration-200 flex items-center justify-between text-right ml-auto w-full cursor-pointer"
            >
              <div className="flex-1 mr-3">
                <div className="text-[10px] text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider font-semibold">पुढील आरती / Next</div>
                <div className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition line-clamp-1 font-devanagari">
                  {nextAarti.title.original}
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-xl group-hover:translate-x-0.5 transition duration-150">arrow_forward</span>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>

      {/* iOS Floating Bottom Navigation Island */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="ios-glass-island rounded-full px-5 py-2.5 flex items-center gap-8 shadow-2xl">
          <Link
            href="/"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-0.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition"
            title="Home"
          >
            <span className="material-symbols-rounded text-2xl">temple_hindu</span>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/search"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-0.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition"
            title="Voice Search"
          >
            <span className="material-symbols-rounded text-2xl">mic</span>
            <span className="text-[10px] font-medium">Voice</span>
          </Link>

          <Link
            href="/settings"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-0.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition"
            title="Settings"
          >
            <span className="material-symbols-rounded text-2xl">settings</span>
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
