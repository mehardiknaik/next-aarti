'use client';

import React, { useState, useEffect } from 'react';
import data from '../store/data';
import Link from 'next/link';

type ThemeOption = 'light' | 'dark' | 'system';
type FontSizeOption = 'small' | 'medium' | 'large' | 'xlarge';
type ScriptOption = 'original' | 'transliteration' | 'both';

export default function Settings() {
  const [theme, setTheme] = useState<ThemeOption>('system');
  const [fontSize, setFontSize] = useState<FontSizeOption>('large');
  const [defaultScript, setDefaultScript] = useState<ScriptOption>('original');
  const [haptics, setHaptics] = useState<boolean>(true);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Load Theme
      const savedTheme = (localStorage.getItem('app_theme') as ThemeOption) || 'system';
      setTheme(savedTheme);

      // Load Font Size
      const savedFontSize = (localStorage.getItem('app_font_size') as FontSizeOption) || 'large';
      setFontSize(savedFontSize);

      // Load Default Script
      const savedScript = (localStorage.getItem('app_default_script') as ScriptOption) || 'original';
      setDefaultScript(savedScript);

      // Load Haptics
      const savedHaptics = localStorage.getItem('app_haptics');
      if (savedHaptics !== null) {
        setHaptics(savedHaptics === 'true');
      }

      // Load Favorites count
      const favs = localStorage.getItem('aarti_favorites');
      if (favs) {
        setFavoritesCount(JSON.parse(favs).length);
      }
    } catch {
      // ignore
    }
  }, []);

  const triggerHaptic = () => {
    if (haptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateTheme = (newTheme: ThemeOption) => {
    triggerHaptic();
    setTheme(newTheme);
    try {
      localStorage.setItem('app_theme', newTheme);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (newTheme === 'dark' || (newTheme === 'system' && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      showToast(`Theme changed to ${newTheme.toUpperCase()}`);
    } catch {
      // ignore
    }
  };

  const updateFontSize = (newSize: FontSizeOption) => {
    triggerHaptic();
    setFontSize(newSize);
    try {
      localStorage.setItem('app_font_size', newSize);
      document.documentElement.setAttribute('data-font-size', newSize);
      showToast('Font size updated');
    } catch {
      // ignore
    }
  };

  const updateScript = (newScript: ScriptOption) => {
    triggerHaptic();
    setDefaultScript(newScript);
    try {
      localStorage.setItem('app_default_script', newScript);
      showToast('Default script updated');
    } catch {
      // ignore
    }
  };

  const toggleHaptics = () => {
    triggerHaptic();
    const next = !haptics;
    setHaptics(next);
    try {
      localStorage.setItem('app_haptics', String(next));
    } catch {
      // ignore
    }
  };

  const clearFavorites = () => {
    triggerHaptic();
    try {
      localStorage.removeItem('aarti_favorites');
      setFavoritesCount(0);
      setShowClearConfirm(false);
      showToast('All favorites cleared');
    } catch {
      // ignore
    }
  };

  const fontSizeClasses: Record<FontSizeOption, string> = {
    small: 'text-base leading-relaxed',
    medium: 'text-lg leading-relaxed',
    large: 'text-xl sm:text-2xl leading-loose',
    xlarge: 'text-2xl sm:text-3xl leading-loose',
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="ios-glass-island px-4 py-2 rounded-full text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* iOS Frosted Navigation Bar */}
      <header className="sticky top-0 z-30 ios-glass-nav transition-all">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            onClick={triggerHaptic}
            className="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium text-sm sm:text-base transition hover:opacity-80 cursor-pointer"
          >
            <span className="material-symbols-rounded text-xl">chevron_left</span>
            <span>आरती संग्रह</span>
          </Link>

          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
            सेटिंग्ज (Settings)
          </h1>

          <Link
            href="/"
            onClick={triggerHaptic}
            className="text-orange-600 dark:text-orange-400 font-semibold text-sm sm:text-base hover:opacity-80"
          >
            Done
          </Link>
        </div>
      </header>

      {/* Main Settings List (iOS Inset Grouped Table Style) */}
      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Section 1: Appearance / Theme */}
        <div>
          <h2 className="text-[12px] uppercase font-semibold text-[#8E8E93] dark:text-[#98989D] px-3.5 mb-2 tracking-wider">
            देखावा / Appearance & Theme
          </h2>
          <div className="ios-glass-card rounded-3xl p-4 sm:p-5">
            {/* 3 Visual Cards for Light, Dark, System */}
            <div className="grid grid-cols-3 gap-3">
              {/* Light */}
              <button
                onClick={() => updateTheme('light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40'
                    : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-full h-16 rounded-xl bg-[#FAF8F5] border border-black/10 flex flex-col p-2 justify-between shadow-xs">
                  <div className="w-8 h-2 rounded-full bg-orange-500/80" />
                  <div className="w-full space-y-1">
                    <div className="w-3/4 h-1.5 rounded-full bg-black/20" />
                    <div className="w-1/2 h-1.5 rounded-full bg-black/10" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${theme === 'light' ? 'border-orange-500 bg-orange-500' : 'border-[#8E8E93]'}`}>
                    {theme === 'light' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">Light</span>
                </div>
              </button>

              {/* Dark */}
              <button
                onClick={() => updateTheme('dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40'
                    : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-full h-16 rounded-xl bg-[#1C1C1E] border border-white/15 flex flex-col p-2 justify-between shadow-xs">
                  <div className="w-8 h-2 rounded-full bg-orange-500/80" />
                  <div className="w-full space-y-1">
                    <div className="w-3/4 h-1.5 rounded-full bg-white/30" />
                    <div className="w-1/2 h-1.5 rounded-full bg-white/15" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'border-orange-500 bg-orange-500' : 'border-[#8E8E93]'}`}>
                    {theme === 'dark' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">Dark</span>
                </div>
              </button>

              {/* System */}
              <button
                onClick={() => updateTheme('system')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition cursor-pointer ${
                  theme === 'system'
                    ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40'
                    : 'border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-full h-16 rounded-xl bg-gradient-to-r from-[#FAF8F5] to-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col p-2 justify-between shadow-xs">
                  <div className="w-8 h-2 rounded-full bg-orange-500/80" />
                  <div className="w-full space-y-1">
                    <div className="w-3/4 h-1.5 rounded-full bg-black/20" />
                    <div className="w-1/2 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${theme === 'system' ? 'border-orange-500 bg-orange-500' : 'border-[#8E8E93]'}`}>
                    {theme === 'system' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">Auto</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Font Size (Dynamic Type) & Live Preview */}
        <div>
          <h2 className="text-[12px] uppercase font-semibold text-[#8E8E93] dark:text-[#98989D] px-3.5 mb-2 tracking-wider">
            फॉन्ट आकार / Reading Text Size
          </h2>
          <div className="ios-glass-card rounded-3xl p-5 space-y-5">
            {/* iOS Segmented Selector */}
            <div className="flex items-center justify-between p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/10">
              <button
                onClick={() => updateFontSize('small')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  fontSize === 'small'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                लहान (A)
              </button>
              <button
                onClick={() => updateFontSize('medium')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  fontSize === 'medium'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                मध्यम (A+)
              </button>
              <button
                onClick={() => updateFontSize('large')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                मोठा (A++)
              </button>
              <button
                onClick={() => updateFontSize('xlarge')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                विशाल (A+++)
              </button>
            </div>

            {/* Live Typography Preview Card */}
            <div className="ios-glass-inset rounded-2xl p-4 sm:p-5 border border-black/5 dark:border-white/10">
              <div className="text-[11px] font-semibold uppercase text-orange-600 dark:text-orange-400 tracking-wider mb-2 flex items-center justify-between">
                <span>थेट पूर्वावलोकन / Live Preview</span>
                <span className="font-mono text-[10px] text-[#8E8E93]">{fontSize.toUpperCase()}</span>
              </div>
              <p className={`font-devanagari font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] ${fontSizeClasses[fontSize]}`}>
                सुखकर्ता दुःखहर्ता वार्ता विघ्नाची ।<br />
                नुरवी पुरवी प्रेम कृपा जयाची ॥
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Script Language Default */}
        <div>
          <h2 className="text-[12px] uppercase font-semibold text-[#8E8E93] dark:text-[#98989D] px-3.5 mb-2 tracking-wider">
            मूळ भाषा / Preferred Default Script
          </h2>
          <div className="ios-glass-card rounded-3xl p-1.5">
            <div className="space-y-1">
              <button
                onClick={() => updateScript('original')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition cursor-pointer ${
                  defaultScript === 'original'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1C1C1E] dark:text-[#F2F2F7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                    म
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">मराठी (Devanagari)</div>
                    <div className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">मराठी मूळ लिपीमध्ये सर्व आरत्या दाखवा</div>
                  </div>
                </div>
                {defaultScript === 'original' && (
                  <span className="material-symbols-rounded text-orange-600 dark:text-orange-400 text-xl">
                    check
                  </span>
                )}
              </button>

              <button
                onClick={() => updateScript('transliteration')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition cursor-pointer ${
                  defaultScript === 'transliteration'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1C1C1E] dark:text-[#F2F2F7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    En
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">English (Transliteration)</div>
                    <div className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">Display phonetic English transliteration</div>
                  </div>
                </div>
                {defaultScript === 'transliteration' && (
                  <span className="material-symbols-rounded text-orange-600 dark:text-orange-400 text-xl">
                    check
                  </span>
                )}
              </button>

              <button
                onClick={() => updateScript('both')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition cursor-pointer ${
                  defaultScript === 'both'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1C1C1E] dark:text-[#F2F2F7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    म+E
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">दोन्ही (Side-by-Side Both)</div>
                    <div className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">Show Marathi lyrics and English transliteration together</div>
                  </div>
                </div>
                {defaultScript === 'both' && (
                  <span className="material-symbols-rounded text-orange-600 dark:text-orange-400 text-xl">
                    check
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: General Settings & Favorites */}
        <div>
          <h2 className="text-[12px] uppercase font-semibold text-[#8E8E93] dark:text-[#98989D] px-3.5 mb-2 tracking-wider">
            सामान्य / Preferences & Storage
          </h2>
          <div className="ios-glass-card rounded-3xl divide-y divide-black/5 dark:divide-white/10 overflow-hidden">
            {/* Haptics toggle row */}
            <div className="flex items-center justify-between p-4 sm:p-4.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg">vibration</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    हॅप्टिक कंपन (Haptic Feedback)
                  </div>
                  <div className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">Vibrate on taps and actions on supported devices</div>
                </div>
              </div>

              {/* iOS Style Toggle Switch */}
              <button
                onClick={toggleHaptics}
                type="button"
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                  haptics ? 'bg-orange-500' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    haptics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Favorites Manager */}
            <div className="flex items-center justify-between p-4 sm:p-4.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg">star</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    जतन केलेल्या आरत्या (Saved Aartis)
                  </div>
                  <div className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">{favoritesCount} Aartis bookmarked</div>
                </div>
              </div>

              {favoritesCount > 0 && (
                <div>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearFavorites}
                        className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-bold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs text-red-500 font-semibold hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: App Information */}
        <div>
          <h2 className="text-[12px] uppercase font-semibold text-[#8E8E93] dark:text-[#98989D] px-3.5 mb-2 tracking-wider">
            माहिती / About
          </h2>
          <div className="ios-glass-card rounded-3xl p-4 sm:p-5 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-rounded text-2xl">temple_hindu</span>
            </div>
            <h3 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
              आरती संग्रह (Aarti Sangrah)
            </h3>
            <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
              Version 1.2.0 • {data.length} Divine Marathi & Hindi Devotional Aartis
            </p>
            <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] pt-2 border-t border-black/5 dark:border-white/10">
              ॥ श्री गणेशाय नमः ॥ • ॥ हर हर महादेव ॥
            </p>
          </div>
        </div>
      </main>

      {/* iOS Floating Bottom Navigation Island */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="ios-glass-island rounded-full px-4 py-2 flex items-center gap-6 shadow-2xl">
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
            className="flex flex-col items-center gap-0.5 text-orange-600 dark:text-orange-400 transition"
            title="Settings"
          >
            <span className="material-symbols-rounded text-2xl">settings</span>
            <span className="text-[10px] font-bold">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
