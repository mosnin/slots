'use client';
import { useEffect, useRef } from 'react';

type Dir = 'up'|'down'|'left'|'right';

export function useMobileControls(move: (dir: Dir) => void) {
  const touchStart = useRef<{x:number,y:number}|null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 15) { move('up'); return; }
      if (adx > ady) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
      touchStart.current = null;
    };
    const onDpad = (e: Event) => move((e as CustomEvent).detail as Dir);

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
