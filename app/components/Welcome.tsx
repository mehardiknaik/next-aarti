'use client';

import React, { useState, useMemo, useEffect } from 'react';
import data from '../store/data';
import Link from 'next/link';

interface AartiItem {
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

// Material 3 Filter Categories
const CATEGORIES = [
  { id: 'all', label: 'सर्व (All)', icon: 'auto_awesome' },
  { id: 'ganpati', label: 'गणपती', icon: 'temp_preferences_custom' },
  { id: 'shankar', label: 'शंकर / शिव', icon: 'brightness_7' },
  { id: 'devi', label: 'देवी माता', icon: 'local_florist' },
  { id: 'vitthal', label: 'विठ्ठल', icon: 'flag' },
  { id: 'datta', label: 'गुरुदत्त', icon: 'spa' },
  { id: 'ram-hanuman', label: 'राम / हनुमान', icon: 'shield' },
  { id: 'other', label: 'इतर (Others)', icon: 'flare' },
];

const getAartiCategory = (item: AartiItem): string => {
  const combined = `${item.title.original} ${item.title.transliteration} ${item.body.original}`.toLowerCase();
  if (combined.includes('गणपती') || combined.includes('गणेश') || combined.includes('गजानन') || combined.includes('गणराज') || combined.includes('सुखकर्ता') || combined.includes('अष्टविनायक') || combined.includes('ganpati') || combined.includes('gajanana') || combined.includes('sukhakarta') || combined.includes('shendur')) {
    return 'ganpati';
  }
  if (combined.includes('शंकर') || combined.includes('शंभो') || combined.includes('कर्पूरगौरा') || combined.includes('shankar') || combined.includes('karpuragaura') || combined.includes('shiv')) {
    return 'shankar';
  }
  if (combined.includes('दुर्गे') || combined.includes('महालक्ष्मी') || combined.includes('चंपावती') || combined.includes('संतोषी') || combined.includes('जोगवा') || combined.includes('भवानी') || combined.includes('अंबे') || combined.includes('durge') || combined.includes('mahalakshmi') || combined.includes('santoshi') || combined.includes('jogva')) {
    return 'devi';
  }
  if (combined.includes('विठ्ठल') || combined.includes('पांडुरंग') || combined.includes('रखुमाई') || combined.includes('पंढरपूर') || combined.includes('vitthal') || combined.includes('panduranga') || combined.includes('yei ho')) {
    return 'vitthal';
  }
  if (combined.includes('दत्त') || combined.includes('सद्गुरू') || combined.includes('datta') || combined.includes('gurudatta') || combined.includes('sadguru')) {
    return 'datta';
  }
  if (combined.includes('हनुमंत') || combined.includes('राम') || combined.includes('हनुमान') || combined.includes('सीता') || combined.includes('hanuman') || combined.includes('shri ram')) {
    return 'ram-hanuman';
  }
  return 'other';
};

export default function Welcome() {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get('q');
        if (qParam) return qParam;
        return sessionStorage.getItem('home_search_query') || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('home_selected_category') || 'all';
      } catch {
        return 'all';
      }
    }
    return 'all';
  });

  const [scriptMode, setScriptMode] = useState<'original' | 'transliteration' | 'both'>('original');
  const [favorites, setFavorites] = useState<string[]>([]);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('home_favorites_only') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state to sessionStorage
  useEffect(() => {
    try {
      if (searchQuery) {
        sessionStorage.setItem('home_search_query', searchQuery);
      } else {
        sessionStorage.removeItem('home_search_query');
      }
      sessionStorage.setItem('home_selected_category', selectedCategory);
      sessionStorage.setItem('home_favorites_only', String(showFavoritesOnly));
    } catch {
      // ignore
    }
  }, [searchQuery, selectedCategory, showFavoritesOnly]);

  // Load preferences on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('aarti_favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }

      const savedScript = localStorage.getItem('app_default_script') as 'original' | 'transliteration' | 'both';
      if (savedScript) {
        setScriptMode(savedScript);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const toggleFavorite = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic();
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem('aarti_favorites', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const copyLyrics = (e: React.MouseEvent, item: AartiItem) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic();
    let text = `${item.title.original} (${item.title.transliteration})\n\n`;
    if (scriptMode === 'original' || scriptMode === 'both') {
      text += `--- मराठी ---\n${item.body.original}\n\n`;
    }
    if (scriptMode === 'transliteration' || scriptMode === 'both') {
      text += `--- Transliteration ---\n${item.body.transliteration}\n`;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(item.key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered list of aartis
  const filteredAartis = useMemo(() => {
    return data.filter((item) => {
      if (showFavoritesOnly && !favorites.includes(item.key)) {
        return false;
      }

      if (selectedCategory !== 'all') {
        const cat = getAartiCategory(item as any);
        if (cat !== selectedCategory) return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch =
        item?.title?.original?.toLowerCase().includes(q) ||
        item?.title?.transliteration.toLowerCase().includes(q);
      const bodyMatch =
        item?.body.original.toLowerCase().includes(q) ||
        item?.body.transliteration.toLowerCase().includes(q);

      return titleMatch || bodyMatch;
    });
  }, [searchQuery, selectedCategory, favorites, showFavoritesOnly]);

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Frosted Glass Top Navigation Bar */}
      <header className="sticky top-0 z-30 ios-glass-nav transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Leading App Icon & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <span className="material-symbols-rounded text-2xl">temple_hindu</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
                आरती संग्रह
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider text-[#8E8E93] dark:text-[#98989D] uppercase">
                Aarti Sangrah • {data.length} Prayers
              </span>
            </div>
          </div>

          {/* Right Action Icons (Voice Search, Saved filter, Settings) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/search"
              onClick={triggerHaptic}
              className="p-2.5 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title="बोलून आरती शोधा (Voice Search)"
            >
              <span className="material-symbols-rounded text-2xl">mic</span>
            </Link>

            <button
              onClick={(e) => {
                triggerHaptic();
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              className={`p-2.5 rounded-full transition relative cursor-pointer flex items-center justify-center ${
                showFavoritesOnly
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={showFavoritesOnly ? 'Show all Aartis' : 'Show saved Aartis'}
            >
              <span className="material-symbols-rounded text-2xl">
                {showFavoritesOnly ? 'star' : 'star_border'}
              </span>
              {favorites.length > 0 && !showFavoritesOnly && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            <Link
              href="/settings"
              onClick={triggerHaptic}
              className="p-2.5 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title="सेटिंग्ज (Settings)"
            >
              <span className="material-symbols-rounded text-2xl">settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* iOS Frosted Search Pill */}
      <section className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <div className="relative flex items-center ios-glass-card rounded-2xl px-4 py-2.5 sm:py-3 transition duration-200 focus-within:ring-2 focus-within:ring-orange-500/50">
          <span className="material-symbols-rounded text-[#8E8E93] dark:text-[#98989D] text-2xl mr-3 select-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="आरती शोधा / Search aarti or lyrics..."
            className="w-full bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] dark:placeholder:text-[#636366] text-sm sm:text-base outline-none font-medium"
          />
          <div className="flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => {
                  triggerHaptic();
                  setSearchQuery('');
                }}
                className="p-1 rounded-full text-[#8E8E93] hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                title="Clear"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            )}
            <Link
              href="/search"
              onClick={triggerHaptic}
              className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition shadow-sm"
              title="Voice Search"
            >
              <span className="material-symbols-rounded text-lg">mic</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 space-y-4">
        {/* iOS Glass Category Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id && !showFavoritesOnly;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic();
                  setShowFavoritesOnly(false);
                  setSelectedCategory(cat.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/50'
                    : 'ios-glass-pill text-[#3A3A3C] dark:text-[#E5E5EA] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span className={`material-symbols-rounded text-base ${active ? 'text-white' : 'text-orange-500 dark:text-orange-400'}`}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* iOS Segmented Bar for Language & Results counter */}
        <div className="ios-glass-card rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#48484A] dark:text-[#AEAEB2] flex items-center gap-1 pl-1">
              <span className="material-symbols-rounded text-base text-orange-500 dark:text-orange-400">translate</span>
              भाषा:
            </span>

            {/* iOS Segmented Switcher */}
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

          <div className="text-xs font-medium text-[#636366] dark:text-[#AEAEB2] pr-2">
            Showing <strong className="text-[#1C1C1E] dark:text-[#F2F2F7] font-bold">{filteredAartis.length}</strong> of {data.length}
          </div>
        </div>

        {/* Aarti Cards Grid (iPhone Inset Frosted Glass Style) */}
        {filteredAartis.length === 0 ? (
          <div className="mt-12 ios-glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-rounded text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
              कोणतीही आरती सापडली नाही
            </h3>
            <p className="text-[#8E8E93] text-xs sm:text-sm mt-1">
              No Aartis match your filter criteria. Try resetting filters.
            </p>
            <button
              onClick={() => {
                triggerHaptic();
                setSearchQuery('');
                setSelectedCategory('all');
                setShowFavoritesOnly(false);
              }}
              className="mt-5 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition shadow-md shadow-orange-500/25 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-rounded text-base">restart_alt</span>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">
            {filteredAartis.map((item) => {
              const isFav = favorites.includes(item.key);
              const isCopied = copiedKey === item.key;
              const firstLineOriginal = item.body.original.split('\n')[0] || '';
              const firstLineTranslit = item.body.transliteration.split('\n')[0] || '';
              const detailUrl = `/aarti/${item.metadata.slug}`;

              return (
                <Link
                  key={item.key}
                  href={detailUrl}
                  onClick={triggerHaptic}
                  className="group relative ios-glass-card hover:scale-[1.01] rounded-3xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div>
                    {/* Header Pill & Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold text-xs">
                        आरती #{item.key}
                      </span>

                      <div className="flex items-center gap-1 z-10">
                        <button
                          onClick={(e) => copyLyrics(e, item as any)}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                          title={isCopied ? 'Copied' : 'Copy lyrics'}
                        >
                          <span className="material-symbols-rounded text-lg">
                            {isCopied ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        <button
                          onClick={(e) => toggleFavorite(e, item.key)}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isFav
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                          title={isFav ? 'Remove from saved' : 'Save Aarti'}
                        >
                          <span className="material-symbols-rounded text-lg">
                            {isFav ? 'star' : 'star_border'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Titles */}
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] dark:text-[#F2F2F7] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition font-devanagari">
                      {item.title.original}
                    </h2>
                    <h3 className="text-xs sm:text-sm font-medium text-[#636366] dark:text-[#AEAEB2] mt-0.5">
                      {item.title.transliteration}
                    </h3>

                    {/* Preview Lyrics */}
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 text-xs text-[#3A3A3C] dark:text-[#D1D1D6] space-y-1">
                      {(scriptMode === 'original' || scriptMode === 'both') && (
                        <p className="line-clamp-2 font-medium italic text-[#1C1C1E] dark:text-[#F2F2F7]">
                          "{firstLineOriginal}"
                        </p>
                      )}
                      {(scriptMode === 'transliteration' || scriptMode === 'both') && (
                        <p className="line-clamp-2 text-[#636366] dark:text-[#AEAEB2]">
                          "{firstLineTranslit}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom iOS Action Row */}
                  <div className="mt-5 pt-3 border-t border-dashed border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition duration-150">
                      <span>संपूर्ण आरती वाचा</span>
                      <span className="material-symbols-rounded text-base">chevron_right</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#636366] dark:text-[#AEAEB2] uppercase">
                      #{item.metadata.slug}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* iOS Floating Bottom Navigation Island */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="ios-glass-island rounded-full px-5 py-2.5 flex items-center gap-8 shadow-2xl">
          <Link
            href="/"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-0.5 text-orange-600 dark:text-orange-400 transition"
            title="Home"
          >
            <span className="material-symbols-rounded text-2xl">temple_hindu</span>
            <span className="text-[10px] font-bold">Home</span>
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