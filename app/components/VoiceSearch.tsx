'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Recognition languages
const LANGUAGES = [
  { code: 'mr-IN', label: 'मराठी', short: 'MR' },
  { code: 'hi-IN', label: 'हिन्दी', short: 'HI' },
  { code: 'en-IN', label: 'English', short: 'EN' },
];

// Quick suggestions
const VOICE_PROMPTS = [
  { text: 'सुखकर्ता दुःखहर्ता', label: 'सुखकर्ता दुःखहर्ता' },
  { text: 'शंकराची आरती', label: 'शंकराची आरती' },
  { text: 'जय जगदीश हरे', label: 'जय जगदीश हरे' },
  { text: 'दुर्गे दुर्घट भारी', label: 'दुर्गे दुर्घट भारी' },
  { text: 'घालीन लोटांगण', label: 'घालीन लोटांगण' },
  { text: 'येई हो विठ्ठले', label: 'येई हो विठ्ठले' },
  { text: 'श्री हनुमंत', label: 'श्री हनुमंत' },
  { text: 'दत्ताची आरती', label: 'दत्ताची आरती' },
];

export default function VoiceSearch() {
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get('q');
        if (qParam) return qParam;
        return sessionStorage.getItem('voice_search_query') || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [selectedLang, setSelectedLang] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('voice_search_lang') || 'mr-IN';
      } catch {
        return 'mr-IN';
      }
    }
    return 'mr-IN';
  });

  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(28).fill(8));
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isPausedRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync accumulatedTextRef whenever query changes and persist search state to sessionStorage & URL
  useEffect(() => {
    accumulatedTextRef.current = query;
    try {
      if (query) {
        sessionStorage.setItem('voice_search_query', query);
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        window.history.replaceState({}, '', url.toString());
      } else {
        sessionStorage.removeItem('voice_search_query');
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, [query]);

  // Persist language selection
  useEffect(() => {
    try {
      sessionStorage.setItem('voice_search_lang', selectedLang);
    } catch {
      // ignore
    }
  }, [selectedLang]);

  // Stop real mic analyser
  const stopAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setWaveBars(new Array(28).fill(8));
    setAudioLevel(0);
  };

  // Start real mic analyser with simulated fallback
  const startAudioAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = () => {
        if (!analyserRef.current || isPausedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const totalBars = 28;

        for (let i = 0; i < totalBars; i++) {
          // Map to frequency bins with symmetrical mirroring for Siri-like waveform
          const binIndex = Math.floor(Math.abs(i - totalBars / 2) * (dataArray.length / (totalBars / 2)));
          const rawVal = dataArray[binIndex] || 0;
          sum += rawVal;
          // Scale height between 8px and 54px
          const barHeight = Math.max(8, Math.min(54, (rawVal / 255) * 54));
          bars.push(barHeight);
        }

        const avg = Math.round((sum / totalBars / 255) * 100);
        setAudioLevel(avg);
        setWaveBars(bars);

        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch {
      // Fallback animated waveform if getUserMedia is denied or already busy with speech
      let phase = 0;
      const updateSimulatedWaveform = () => {
        if (isPausedRef.current) return;
        phase += 0.15;
        const bars: number[] = [];
        const totalBars = 28;

        for (let i = 0; i < totalBars; i++) {
          const distFromCenter = 1 - Math.abs(i - totalBars / 2) / (totalBars / 2);
          const wave = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
          const noise = Math.sin(phase * 2 + i * 0.8) * 0.2;
          const height = Math.max(8, Math.min(52, (wave + noise) * 44 * distFromCenter + 10));
          bars.push(height);
        }

        setAudioLevel(Math.round(40 + Math.sin(phase) * 30));
        setWaveBars(bars);
        animFrameRef.current = requestAnimationFrame(updateSimulatedWaveform);
      };

      updateSimulatedWaveform();
    }
  };

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setIsPaused(false);
        isPausedRef.current = false;
        setSpeechError(null);
        setInterimText('');
        startAudioAnalyser();
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript) {
          const cleaned = finalTranscript.trim().replace(/[.,!?;:]/g, '');
          const prefix = accumulatedTextRef.current ? accumulatedTextRef.current.trim() + ' ' : '';
          const fullText = (prefix + cleaned).trim();
          setQuery(fullText);
          accumulatedTextRef.current = fullText;
          setInterimText('');
        } else {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        if (isPausedRef.current) {
          return;
        }
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          setIsPaused(false);
          isPausedRef.current = false;
          stopAudioAnalyser();
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // In continuous mode, no-speech is normal during pauses; do not abort
        } else if (event.error === 'network') {
          setSpeechError('Network issue with speech service. You can also type to search.');
        } else {
          setSpeechError(`Voice recognition: ${event.error}. Speak or type query.`);
        }
      };

      recognition.onend = () => {
        // Auto restart if still supposed to be listening (e.g. browser timed out speech endpoint)
        if (!isPausedRef.current && isListening) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            setIsPaused(false);
            stopAudioAnalyser();
          }
        } else if (!isPausedRef.current) {
          setIsListening(false);
          setIsPaused(false);
          stopAudioAnalyser();
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    // Load favorites
    try {
      const saved = localStorage.getItem('aarti_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    } catch {
      // ignore
    }

    return () => {
      stopAudioAnalyser();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Update language on recognition object
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLang;
    }
  }, [selectedLang]);

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

  const startListening = () => {
    triggerHaptic();
    if (!recognitionRef.current) return;
    setSpeechError(null);
    setInterimText('');
    isPausedRef.current = false;
    setIsPaused(false);
    accumulatedTextRef.current = query;
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Could not start recognition directly, restarting', err);
      try {
        recognitionRef.current.abort();
        setTimeout(() => recognitionRef.current.start(), 150);
      } catch (retryErr) {
        setSpeechError('Could not start microphone. Please try again.');
      }
    }
  };

  const pauseListening = () => {
    triggerHaptic();
    isPausedRef.current = true;
    setIsPaused(true);
    setIsListening(false);

    // Commit current interim text if any
    if (interimText.trim()) {
      const prefix = accumulatedTextRef.current ? accumulatedTextRef.current.trim() + ' ' : '';
      const combined = (prefix + interimText.trim()).trim();
      setQuery(combined);
      accumulatedTextRef.current = combined;
      setInterimText('');
    }

    // Stop recognition & mic stream
    stopAudioAnalyser();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const resumeListening = () => {
    triggerHaptic();
    isPausedRef.current = false;
    setIsPaused(false);
    setIsListening(true);
    setSpeechError(null);
    accumulatedTextRef.current = query;
    startAudioAnalyser();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        try {
          recognitionRef.current.abort();
          setTimeout(() => recognitionRef.current.start(), 150);
        } catch {
          // ignore
        }
      }
    }
  };

  const stopListening = () => {
    triggerHaptic();
    isPausedRef.current = false;
    setIsPaused(false);
    setIsListening(false);

    if (interimText.trim()) {
      const prefix = accumulatedTextRef.current ? accumulatedTextRef.current.trim() + ' ' : '';
      const combined = (prefix + interimText.trim()).trim();
      setQuery(combined);
      accumulatedTextRef.current = combined;
      setInterimText('');
    }

    stopAudioAnalyser();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      pauseListening();
    } else if (isPaused) {
      resumeListening();
    } else {
      startListening();
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

  // Search results ranking - live matching against query OR currently streaming interim speech
  const searchResults = useMemo(() => {
    // Combine committed query and live interim spoken speech seamlessly
    const liveSpoken = [query, interimText].filter(Boolean).join(' ').trim().toLowerCase();
    if (!liveSpoken) return [];

    const keywords = liveSpoken.split(/\s+/).filter(Boolean);

    return data
      .map((item) => {
        const titleOrig = item.title?.original?.toLowerCase();
        const titleTrans = item.title?.transliteration?.toLowerCase();
        const bodyOrig = item.body.original.toLowerCase();
        const bodyTrans = item.body.transliteration.toLowerCase();

        let score = 0;

        // Exact match
        if (titleOrig?.includes(liveSpoken) || titleTrans.includes(liveSpoken)) score += 100;
        if (bodyOrig.includes(liveSpoken) || bodyTrans.includes(liveSpoken)) score += 40;

        // Keyword matches
        for (const kw of keywords) {
          if (titleOrig?.includes(kw)) score += 30;
          if (titleTrans.includes(kw)) score += 25;
          if (bodyOrig.includes(kw)) score += 10;
          if (bodyTrans.includes(kw)) score += 8;
        }

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);
  }, [query, interimText]);

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-30 ios-glass-nav transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={triggerHaptic}
              className="p-2.5 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title="मुख्य पृष्ठ (Home)"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </Link>
            <span className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
              बोलून आरती शोधा
            </span>
          </div>

          {/* iOS Segmented Language Switcher & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              <span className="material-symbols-rounded text-2xl text-amber-500 dark:text-yellow-300">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/10">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedLang(lang.code);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                  }`}
                >
                  {lang.short}
                </button>
              ))}
            </div>

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

      {/* Main Voice Hub */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        {/* iOS Frosted Glass Voice Card */}
        <div className="ios-glass-card rounded-3xl p-6 sm:p-10 text-center shadow-xl">
          {/* Unsupported Browser Warning */}
          {isSupported === false && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs sm:text-sm text-left flex items-start gap-3">
              <span className="material-symbols-rounded text-2xl">warning</span>
              <div>
                <strong>Voice Recognition not supported in this browser.</strong>
                <p className="mt-0.5 text-[#8E8E93]">
                  Please use Google Chrome, Edge, or Safari for voice search, or type your query in the box below.
                </p>
              </div>
            </div>
          )}

          {/* Animated iOS Liquid Voice Orb & Dynamic Audio Waveform with Pause Support */}
          <div className="relative flex flex-col items-center justify-center my-4">
            <div className="relative inline-flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-orange-500/20 animate-ping pointer-events-none" />
                  <span className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-orange-500/30 animate-pulse pointer-events-none" />
                </>
              )}

              {isPaused && (
                <span className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-amber-500/20 animate-pulse pointer-events-none" />
              )}

              <button
                onClick={toggleListening}
                disabled={isSupported === false}
                className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
                  isListening
                    ? 'bg-red-500 text-white scale-105 ring-4 ring-red-300 dark:ring-red-900/50'
                    : isPaused
                    ? 'bg-amber-500 text-white scale-100 ring-4 ring-amber-300 dark:ring-amber-900/50'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white hover:scale-105 shadow-orange-500/30'
                }`}
                title={isListening ? 'Pause listening' : isPaused ? 'Resume listening' : 'Start speaking'}
              >
                <span className="material-symbols-rounded text-4xl">
                  {isListening ? 'pause' : isPaused ? 'play_arrow' : 'mic'}
                </span>
                <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">
                  {isListening ? 'Tap to Pause' : isPaused ? 'Tap to Resume' : 'Tap to Speak'}
                </span>
              </button>
            </div>

            {/* Quick In-Call Actions (Pause / Resume / Stop) */}
            {(isListening || isPaused) && (
              <div className="mt-5 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {isListening ? (
                  <button
                    onClick={pauseListening}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Pause listening"
                  >
                    <span className="material-symbols-rounded text-lg">pause</span>
                    <span>पॉज करा (Pause)</span>
                  </button>
                ) : (
                  <button
                    onClick={resumeListening}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Resume listening"
                  >
                    <span className="material-symbols-rounded text-lg">play_arrow</span>
                    <span>सुरू ठेवा (Resume)</span>
                  </button>
                )}

                <button
                  onClick={stopListening}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/30 text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Finish speaking"
                >
                  <span className="material-symbols-rounded text-lg">stop</span>
                  <span>पूर्ण करा (Done)</span>
                </button>
              </div>
            )}

            {/* Live / Paused Audio Waveform Visualization Bar */}
            {(isListening || isPaused) && (
              <div className="mt-6 w-full max-w-md mx-auto ios-glass-inset rounded-2xl p-4 border border-orange-500/30 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3 px-1 text-[11px] font-semibold text-[#8E8E93] dark:text-[#AEAEB2]">
                  <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <span className={`inline-block w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                    <span>{isListening ? 'Live Audio Waveform' : 'Waveform (Paused)'}</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {isListening ? (audioLevel > 0 ? `${audioLevel}% Level` : 'Listening...') : 'Paused'}
                  </span>
                </div>

                {/* Waveform Equalizer Bars */}
                <div className="h-14 flex items-center justify-center gap-1 sm:gap-1.5 px-2 overflow-hidden">
                  {waveBars.map((height, idx) => {
                    const isCenter = Math.abs(idx - waveBars.length / 2) < 6;
                    return (
                      <div
                        key={idx}
                        style={{
                          height: isPaused ? '10px' : `${height}px`,
                          transition: 'height 0.08s ease-out',
                        }}
                        className={`w-1 sm:w-1.5 rounded-full transition-all ${
                          isPaused
                            ? 'bg-amber-400/40 dark:bg-amber-500/30'
                            : isCenter
                            ? 'bg-gradient-to-t from-red-500 via-orange-500 to-amber-300 shadow-sm shadow-orange-500/50'
                            : 'bg-gradient-to-t from-orange-500 to-amber-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transcript & Listening feedback */}
          <div className="mt-4 min-h-[3.5rem] flex flex-col items-center justify-center">
            {isListening ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>बोलत रहा ({LANGUAGES.find((l) => l.code === selectedLang)?.label})...</span>
                </div>
                <p className="text-[#1C1C1E] dark:text-[#F2F2F7] font-bold text-lg sm:text-2xl italic font-devanagari mt-1">
                  {interimText ? `"${interimText}"` : 'कृपया बोला (Speak now)...'}
                </p>
              </div>
            ) : isPaused ? (
              <div className="flex flex-col items-center gap-1.5 animate-in fade-in">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>मायक्रोफोन थांबवला आहे (Microphone Paused)</span>
                </div>
                <p className="text-[#636366] dark:text-[#AEAEB2] text-xs mt-1">
                  पुन्हा बोलण्यासाठी <strong className="text-orange-600 dark:text-orange-400">Resume</strong> किंवा मध्यभागी टॅप करा
                </p>
              </div>
            ) : query ? (
              <div className="inline-flex items-center gap-2 bg-black/5 dark:bg-white/10 px-4 py-2 rounded-2xl border border-black/5 dark:border-white/10">
                <span className="text-xs font-semibold text-[#8E8E93] uppercase">Search:</span>
                <span className="text-base sm:text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
                  "{query}"
                </span>
              </div>
            ) : (
              <p className="text-[#8E8E93] dark:text-[#98989D] text-xs sm:text-sm">
                मायक्रोफोन बटण दाबा आणि आरतीचे नाव किंवा ओळ बोला
              </p>
            )}

            {speechError && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium bg-red-500/15 px-4 py-2 rounded-xl">
                {speechError}
              </p>
            )}
          </div>

          {/* Manual Input Pill */}
          <div className="mt-6 max-w-xl mx-auto">
            <div className="relative flex items-center ios-glass-inset rounded-2xl px-4 py-2.5 transition border border-black/5 dark:border-white/10 focus-within:ring-2 focus-within:ring-orange-500/50">
              <span className="material-symbols-rounded text-[#8E8E93] mr-2">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="किंवा येथे टाईप करा (or type query)..."
                className="w-full bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] text-sm sm:text-base outline-none font-medium"
              />
              {query && (
                <button
                  onClick={() => {
                    triggerHaptic();
                    setQuery('');
                    setInterimText('');
                  }}
                  className="p-1 rounded-full text-[#8E8E93] hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Clear"
                >
                  <span className="material-symbols-rounded text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* iOS Quick Prompt Chips */}
          <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-[#636366] dark:text-[#AEAEB2] font-bold mb-3">
              उदाहरणे (Try speaking or tap):
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {VOICE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => {
                    triggerHaptic();
                    setQuery(prompt.text);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    query === prompt.text
                      ? 'bg-orange-500 text-white font-bold shadow-sm'
                      : 'ios-glass-pill text-[#3A3A3C] dark:text-[#E5E5EA] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <span className={`material-symbols-rounded text-sm ${query === prompt.text ? 'text-white' : 'text-orange-500 dark:text-orange-400'}`}>record_voice_over</span>
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mt-8 flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-2 font-devanagari">
            <span>शोध परिणाम (Search Results)</span>
            {searchResults.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-bold">
                {searchResults.length}
              </span>
            )}
            {isListening && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Live
              </span>
            )}
          </h2>

          {(query || interimText) && (
            <button
              onClick={() => {
                triggerHaptic();
                setQuery('');
                setInterimText('');
                accumulatedTextRef.current = '';
              }}
              className="text-xs text-orange-600 dark:text-orange-400 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="mt-4">
          {!query.trim() && !interimText.trim() ? (
            <div className="ios-glass-card rounded-3xl p-10 text-center border border-dashed border-black/10 dark:border-white/15">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-rounded text-2xl">mic</span>
              </div>
              <p className="text-[#1C1C1E] dark:text-[#F2F2F7] font-semibold text-sm font-devanagari">
                मायक्रोफोन बटणावर क्लिक करून बोला किंवा वर सुचवलेल्या शब्दांवर टॅप करा
              </p>
              <p className="text-[#8E8E93] text-xs mt-1">
                Click the microphone orb above and speak to search Aartis instantly in real time.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="ios-glass-card rounded-3xl p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-rounded text-2xl">search_off</span>
              </div>
              <h3 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] font-devanagari">
                "{[query, interimText].filter(Boolean).join(' ')}" साठी कोणतीही आरती सापडली नाही
              </h3>
              <p className="text-[#8E8E93] text-xs mt-1">
                No Aartis matched your search. Try speaking another title or keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((item) => {
                const isFav = favorites.includes(item.key);
                const firstLineOriginal = item.body.original.split('\n')[0] || '';

                return (
                  <Link
                    key={item.key}
                    href={`/aarti/${item.metadata.slug}`}
                    onClick={triggerHaptic}
                    className="group relative ios-glass-card hover:scale-[1.01] rounded-3xl p-5 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold text-xs">
                          #{item.key}
                        </span>
                        <button
                          onClick={(e) => toggleFavorite(e, item.key)}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isFav
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                          title={isFav ? 'Saved' : 'Save Aarti'}
                        >
                          <span className="material-symbols-rounded text-lg">
                            {isFav ? 'star' : 'star_border'}
                          </span>
                        </button>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#1C1C1E] dark:text-[#F2F2F7] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition font-devanagari">
                        {item.title.original}
                      </h3>
                      <h4 className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D] mt-0.5">
                        {item.title.transliteration}
                      </h4>

                      <p className="mt-3 text-xs text-[#48484A] dark:text-[#AEAEB2] line-clamp-2 italic ios-glass-inset p-3 rounded-2xl">
                        "{firstLineOriginal}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition duration-150">
                        <span>संपूर्ण आरती वाचा</span>
                        <span className="material-symbols-rounded text-base">chevron_right</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#8E8E93]">
                        #{item.metadata.slug}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
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
            className="flex flex-col items-center gap-0.5 text-orange-600 dark:text-orange-400 transition"
            title="Voice Search"
          >
            <span className="material-symbols-rounded text-2xl">mic</span>
            <span className="text-[10px] font-bold">Voice</span>
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
