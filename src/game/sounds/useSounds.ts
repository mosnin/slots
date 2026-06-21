'use client';
import { useRef } from 'react';

function createAudioContext() {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

function playTone(ctx: AudioContext, freq: number, type: OscillatorType, duration: number, vol = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  return {
    playHop: () => {
      const ctx = getCtx();
      if (!ctx) return;
      playTone(ctx, 400, 'sine', 0.08, 0.4);
      playTone(ctx, 600, 'sine', 0.06, 0.2);
    },
    playSquash: () => {
      const ctx = getCtx();
      if (!ctx) return;
      // Low thud + noise
      playTone(ctx, 80, 'sawtooth', 0.3, 0.6);
      playTone(ctx, 120, 'square', 0.15, 0.2);
    },
    playScore: () => {
      const ctx = getCtx();
      if (!ctx) return;
      // Ascending ding
      [523, 659, 784].forEach((f, i) => {
        setTimeout(() => playTone(ctx, f, 'sine', 0.15, 0.3), i * 80);
      });
    },
    playMilestone: () => {
      const ctx = getCtx();
      if (!ctx) return;
      // Fanfare
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => playTone(ctx, f, 'sine', 0.2, 0.4), i * 100);
      });
    },
    playCar: () => {
      const ctx = getCtx();
      if (!ctx) return;
      // Car whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    },
  };
}
