'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FileText } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  duration?: number;
  transcript?: string | null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ src, title, duration: initialDuration, transcript }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => setPlaying(false);

    // 1. If the audio metadata is already loaded (cached), set it immediately
    if (audio.readyState >= 1) {
      onLoadedMetadata();
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    // 2. Handle cases where the source might change
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]); // Re-run effect when the source changes

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <p className="text-sm font-medium text-zinc-300 mb-4 truncate">{title}</p>
      )}

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-sky-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Time */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-15)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        >
          {playing ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>

        <button
          onClick={() => skip(15)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Transcript Toggle */}
      {transcript && (
        <div className="mt-8 pt-6 border-t border-zinc-700/50">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
          >
            <FileText size={14} />
            {showTranscript ? 'Hide Archive Transcript' : 'View Archive Transcript'}
          </button>

          {showTranscript && (
            <div className="mt-4 p-5 bg-black/40 rounded-xl border border-zinc-700/50 animate-reveal">
              <p className="text-zinc-300 text-sm leading-relaxed font-medium font-serif italic whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}