'use client';
import { useEffect, useRef } from 'react';

type Dir = 'up' | 'down' | 'left' | 'right';

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

export function useMobileControls(move: (dir: Dir) => void) {
  const touchStart = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Don't track swipes that start on a D-pad button — those fire their own event
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-dpad]')) return;
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        target: e.target,
      };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      // Ignore if the touch started on a D-pad button
      const target = (e.target as HTMLElement | null);
      if (target?.closest('[data-dpad]')) { touchStart.current = null; return; }

      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      touchStart.current = null;

      let dir: Dir;
      if (Math.max(adx, ady) < 12) {
        dir = 'up'; // tap = forward
      } else if (adx > ady) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }
      vibrate(18);
      move(dir);
    };

    const onDpad = (e: Event) => {
      vibrate(18);
      move((e as CustomEvent).detail as Dir);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('dpad', onDpad);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('dpad', onDpad);
    };
  }, [move]);
}
