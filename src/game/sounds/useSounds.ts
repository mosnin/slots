'use client';
import { useRef } from 'react';

function getCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ref.current) {
    ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

// Gain node helper
function makeGain(ctx: AudioContext, vol: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.connect(ctx.destination);
  return g;
}

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  return {
    playHop: () => {
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      // Short percussive click + pitched pop — feels like a footstep
      const osc = ctx.createOscillator();
      const gain = makeGain(ctx, 0);
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    },

    playSquash: () => {
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      // Layered thud: low boom + mid crunch + noise burst
      const now = ctx.currentTime;

      // Low body thud
      const boom = ctx.createOscillator();
      const boomGain = makeGain(ctx, 0);
      boom.connect(boomGain);
      boom.type = 'sine';
      boom.frequency.setValueAtTime(90, now);
      boom.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      boomGain.gain.setValueAtTime(0.7, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      boom.start(now);
      boom.stop(now + 0.36);

      // Mid crunch
      const crunch = ctx.createOscillator();
      const crunchGain = makeGain(ctx, 0);
      crunch.connect(crunchGain);
      crunch.type = 'sawtooth';
      crunch.frequency.setValueAtTime(180, now);
      crunch.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      crunchGain.gain.setValueAtTime(0.3, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      crunch.start(now);
      crunch.stop(now + 0.16);

      // White noise burst via buffer
      try {
        const bufSize = ctx.sampleRate * 0.15;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const nGain = makeGain(ctx, 0.18);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1200;
        src.connect(lp);
        lp.connect(nGain);
        nGain.gain.setValueAtTime(0.18, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        src.start(now);
      } catch { /* ignore */ }
    },

    playScore: () => {
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      // Bright ascending arpeggio — reward feel
      const notes = [523, 659, 784]; // C5 E5 G5
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.07;
        const osc = ctx.createOscillator();
        const gain = makeGain(ctx, 0);
        osc.connect(gain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.19);
      });
    },

    playMilestone: () => {
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      // Punchy fanfare — 4-note chord swell
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.085;
        const osc = ctx.createOscillator();
        const gain = makeGain(ctx, 0);
        osc.connect(gain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    },

    playCar: () => {
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      // Engine rumble: detuned oscillators + low-pass filter
      const now = ctx.currentTime;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      lp.connect(ctx.destination);

      [82, 87, 95].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(lp);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 2.2, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.22);
        g.gain.setValueAtTime(0.09, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    },
  };
}
