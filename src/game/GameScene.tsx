'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSounds } from './sounds/useSounds';
import { useMobileControls } from './hooks/useMobileControls';
import { useKeyboardControls } from './hooks/useKeyboardControls';

// ── Constants ──────────────────────────────────────────────────────────────
const LANE_H = 58;
const TOTAL_LANES = 50;
const CHICKEN_W = 26;
const CHICKEN_H = 32;
const CAR_COLORS = [
  '#e74c3c','#3b82f6','#f59e0b','#8b5cf6',
  '#10b981','#f97316','#ec4899','#06b6d4',
  '#ef4444','#6366f1',
];

type Dir = 'up' | 'down' | 'left' | 'right';

interface Car {
  id: number;
  lane: number;
  x: number;
  speed: number;
  dir: 1 | -1;
  color: string;
  w: number;
  h: number;
}

interface Popup {
  x: number;
  wy: number; // world y
  age: number;
}

interface Cloud {
  x: number;
  sy: number; // screen y (fixed, not scrolling)
  w: number;
  h: number;
  speed: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getLaneType(i: number): 'safe' | 'road' {
  return i % 4 === 0 ? 'safe' : 'road';
}

function laneWorldY(lane: number) {
  return lane * LANE_H;
}

function makeCars(canvasW: number): Car[] {
  const cars: Car[] = [];
  let id = 0;
  for (let lane = 1; lane < TOTAL_LANES; lane++) {
    if (getLaneType(lane) !== 'road') continue;
    const diff = Math.min(1, lane / 38);
    const count = 2 + Math.floor(diff * 4); // 2-6
    const baseSpeed = 55 + diff * 140;      // 55-195 px/s
    const dir: 1 | -1 = lane % 2 === 0 ? 1 : -1;
    const carW = 42 + Math.floor(Math.random() * 32);
    for (let c = 0; c < count; c++) {
      cars.push({
        id: id++,
        lane,
        x: (c / count) * (canvasW + 500) - 100 + Math.random() * 30,
        speed: baseSpeed * (0.8 + Math.random() * 0.4),
        dir,
        color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
        w: carW,
        h: 30,
      });
    }
  }
  return cars;
}

function makeClouds(): Cloud[] {
  return Array.from({ length: 7 }, (_, i) => ({
    x: (i / 7) * 500 + Math.random() * 60,
    sy: 15 + Math.random() * 55,
    w: 90 + Math.random() * 90,
    h: 28 + Math.random() * 18,
    speed: 10 + Math.random() * 14,
  }));
}

// ── Canvas drawing ─────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + R);
  ctx.lineTo(x + w, y + h - R);
  ctx.quadraticCurveTo(x + w, y + h, x + w - R, y + h);
  ctx.lineTo(x + R, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - R);
  ctx.lineTo(x, y + R);
  ctx.quadraticCurveTo(x, y, x + R, y);
  ctx.closePath();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.shadowColor = 'rgba(160,200,240,0.35)';
  ctx.shadowBlur = 10;
  const r = h * 0.5;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.arc(x + w * 0.48, y + r * 0.65, r * 1.15, 0, Math.PI * 2);
  ctx.arc(x + w - r * 0.9, y + r, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, dir: 1 | -1) {
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.save();
  // Body
  ctx.fillStyle = color;
  ctx.shadowColor = color + '55';
  ctx.shadowBlur = 8;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Roof / windshield area
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  const roofW = w * 0.46;
  const roofX = x + (w - roofW) / 2;
  roundRect(ctx, roofX, y + h * 0.12, roofW, h * 0.48, 4);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#1a1a1a';
  const wr = 5.5;
  [[x + w * 0.18, y + wr], [x + w * 0.82, y + wr],
   [x + w * 0.18, y + h - wr], [x + w * 0.82, y + h - wr]].forEach(([wx, wy]) => {
    ctx.beginPath();
    ctx.arc(wx as number, wy as number, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(wx as number, wy as number, wr * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
  });

  // Headlights (front)
  const hlX = dir === 1 ? x + w - 5 : x + 5;
  ctx.fillStyle = 'rgba(255,250,200,0.95)';
  ctx.shadowColor = '#fffde7';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(hlX, y + h * 0.28, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hlX, y + h * 0.72, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawChicken(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  dir: Dir, bob: number, dead: boolean, scale = 1
) {
  ctx.save();
  ctx.translate(cx, cy + bob);
  if (dead) ctx.rotate(Math.PI * 0.45);
  ctx.scale(scale, scale);

  const s = 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, CHICKEN_H * 0.52 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#f5eecc';
  ctx.strokeStyle = '#c8b87a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 10 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wing highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-3 * s, 2 * s, 5 * s, 8 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f5eecc';
  ctx.strokeStyle = '#c8b87a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -11 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Comb
  ctx.fillStyle = '#e74c3c';
  for (let ci = 0; ci < 3; ci++) {
    ctx.beginPath();
    ctx.ellipse((-2 + ci * 2) * s, (-18 - ci * 0.5) * s, 2 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wattle
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.ellipse(1 * s, -6 * s, 2.5 * s, 3 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#f39c12';
  ctx.strokeStyle = '#e08b0d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (dir === 'left') {
    ctx.moveTo(-7 * s, -11 * s);
    ctx.lineTo(-14 * s, -9 * s);
    ctx.lineTo(-7 * s, -7 * s);
  } else if (dir === 'right') {
    ctx.moveTo(7 * s, -11 * s);
    ctx.lineTo(14 * s, -9 * s);
    ctx.lineTo(7 * s, -7 * s);
  } else {
    ctx.moveTo(-3 * s, -18 * s);
    ctx.lineTo(3 * s, -18 * s);
    ctx.lineTo(0, -23 * s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eye
  const eyeX = dir === 'left' ? -4 * s : 4 * s;
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(eyeX, -13 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(eyeX + 0.8 * s, -13.8 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#e08b0d';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  const legAnim = dead ? 0 : bob * 1.5;
  ctx.beginPath();
  ctx.moveTo(-3 * s, 15 * s);
  ctx.lineTo(-3 * s + legAnim, 21 * s);
  ctx.moveTo(3 * s, 15 * s);
  ctx.lineTo(3 * s - legAnim, 21 * s);
  ctx.stroke();

  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────
export function GameScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setPhase = useGameStore(s => s.setPhase);
  const incrementScore = useGameStore(s => s.incrementScore);
  const incrementDistance = useGameStore(s => s.incrementDistance);
  const sounds = useSounds();

  // All mutable game state in refs (never cause re-renders)
  const carsRef = useRef<Car[]>([]);
  const cloudsRef = useRef<Cloud[]>(makeClouds());
  const popupsRef = useRef<Popup[]>([]);
  const chickRef = useRef({ x: 240, lane: 0 });
  const chickDirRef = useRef<Dir>('up');
  const chickBobRef = useRef(0);
  const chickMoveRef = useRef(false);
  const camYRef = useRef(0);
  const isDead = useRef(false);
  const phaseRef = useRef<'idle' | 'playing' | 'dead'>('idle');
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const canvasWRef = useRef(480);

  // Keep phaseRef in sync
  const rawPhase = useGameStore(s => s.phase);
  useEffect(() => { phaseRef.current = rawPhase; }, [rawPhase]);

  const startGame = useCallback(() => {
    isDead.current = false;
    chickRef.current = { x: canvasWRef.current / 2, lane: 0 };
    chickDirRef.current = 'up';
    chickBobRef.current = 0;
    chickMoveRef.current = false;
    camYRef.current = laneWorldY(0);
    popupsRef.current = [];
    carsRef.current = makeCars(canvasWRef.current);
    setPhase('playing');
  }, [setPhase]);

  const move = useCallback((dir: Dir) => {
    if (phaseRef.current !== 'playing' || isDead.current || chickMoveRef.current) return;
    chickDirRef.current = dir;
    chickMoveRef.current = true;
    setTimeout(() => { chickMoveRef.current = false; }, 140);
    sounds.playHop();

    const cur = chickRef.current;
    let newLane = cur.lane;
    let newX = cur.x;
    const W = canvasWRef.current;

    if (dir === 'up')    newLane = cur.lane + 1;
    else if (dir === 'down') newLane = Math.max(0, cur.lane - 1);
    else if (dir === 'left')  newX = Math.max(22, cur.x - 40);
    else if (dir === 'right') newX = Math.min(W - 22, cur.x + 40);

    if (dir === 'up' && newLane > cur.lane) {
      incrementScore();
      incrementDistance();
      if (newLane % 10 === 0) sounds.playMilestone();
      else if (getLaneType(newLane) === 'safe') sounds.playScore();
      popupsRef.current = [
        ...popupsRef.current.slice(-6),
        { x: newX, wy: laneWorldY(newLane), age: 0 },
      ];
    }

    chickRef.current = { x: newX, lane: newLane };
  }, [incrementScore, incrementDistance, sounds]);

  useKeyboardControls(move);
  useMobileControls(move);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvasWRef.current = rect.width;
      if (phaseRef.current === 'idle') {
        chickRef.current.x = rect.width / 2;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (t: number) => {
      const dt = Math.min((t - lastTRef.current) / 1000, 0.05);
      lastTRef.current = t;

      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const phase = phaseRef.current;

      // ── UPDATE ─────────────────────────────────────────────
      if (phase === 'playing' && !isDead.current) {
        // Cars
        const newCars = carsRef.current.map(car => {
          let nx = car.x + car.speed * car.dir * dt;
          if (nx > W + 250)  nx = -250;
          if (nx < -250) nx = W + 250;
          return { ...car, x: nx };
        });
        carsRef.current = newCars;

        // Bob
        chickBobRef.current = Math.sin(t / 90) * (chickMoveRef.current ? 4 : 1.2);

        // Smooth camera
        const targetCamY = laneWorldY(chickRef.current.lane);
        camYRef.current += (targetCamY - camYRef.current) * (1 - Math.pow(0.002, dt));

        // Collision
        const cx = chickRef.current.x;
        const cl = chickRef.current.lane;
        const cy = laneWorldY(cl);
        for (const car of carsRef.current) {
          if (car.lane !== cl) continue;
          const carCX = car.x + car.w / 2;
          if (Math.abs(carCX - cx) < car.w / 2 + CHICKEN_W / 2 - 4) {
            isDead.current = true;
            sounds.playSquash();
            setPhase('dead');
            break;
          }
        }

        // Popups age
        popupsRef.current = popupsRef.current
          .map(p => ({ ...p, age: p.age + dt }))
          .filter(p => p.age < 1.0);
      }

      // Clouds drift (always)
      cloudsRef.current = cloudsRef.current.map(c => {
        let nx = c.x + c.speed * dt;
        if (nx > W + 200) nx = -200;
        return { ...c, x: nx };
      });

      // ── DRAW ───────────────────────────────────────────────

      // worldToScreen: transforms world-Y to screen-Y
      // camYRef = world Y of the chicken; chicken appears at H * 0.62
      const anchorY = H * 0.62;
      const wts = (worldY: number) => anchorY - (worldY - camYRef.current);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#63b3ed');
      sky.addColorStop(1, '#bde0f5');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Clouds (screen-space, upper portion only)
      cloudsRef.current.forEach(c => drawCloud(ctx, c.x, c.sy, c.w, c.h));

      // Lane strips
      const topLane = Math.ceil((camYRef.current + H * 0.62) / LANE_H) + 2;
      const botLane = Math.floor((camYRef.current - H * 0.45) / LANE_H) - 1;

      for (let i = Math.max(0, botLane); i <= Math.min(TOTAL_LANES - 1, topLane); i++) {
        const wy = laneWorldY(i);
        const sy = wts(wy);
        const top = sy - LANE_H / 2;
        const type = getLaneType(i);

        if (type === 'safe') {
          const g = ctx.createLinearGradient(0, top, 0, top + LANE_H);
          g.addColorStop(0, '#5aa63c');
          g.addColorStop(1, '#4a8f30');
          ctx.fillStyle = g;
          ctx.fillRect(0, top, W, LANE_H);

          // Grass blade dots
          ctx.fillStyle = 'rgba(255,255,180,0.55)';
          for (let fx = 20 + (i * 37 % 20); fx < W; fx += 55) {
            ctx.beginPath();
            ctx.arc(fx, top + LANE_H / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Edge stripe
          ctx.fillStyle = 'rgba(100,180,60,0.6)';
          ctx.fillRect(0, top, W, 3);
          ctx.fillRect(0, top + LANE_H - 3, W, 3);
        } else {
          // Road
          const g = ctx.createLinearGradient(0, top, 0, top + LANE_H);
          g.addColorStop(0, '#565656');
          g.addColorStop(1, '#484848');
          ctx.fillStyle = g;
          ctx.fillRect(0, top, W, LANE_H);

          // Center dashes
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          ctx.setLineDash([18, 14]);
          ctx.beginPath();
          ctx.moveTo(0, top + LANE_H / 2);
          ctx.lineTo(W, top + LANE_H / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Below-world ground (lane 0 area extended down)
      const groundTop = wts(-LANE_H);
      if (groundTop < H) {
        const g = ctx.createLinearGradient(0, groundTop, 0, H);
        g.addColorStop(0, '#4a8f30');
        g.addColorStop(1, '#3d7527');
        ctx.fillStyle = g;
        ctx.fillRect(0, groundTop, W, H - groundTop);
      }

      // Cars
      if (phase !== 'idle') {
        carsRef.current.forEach(car => {
          const sy = wts(laneWorldY(car.lane));
          if (sy < -60 || sy > H + 60) return;
          drawCar(ctx, car.x + car.w / 2, sy, car.w, car.h, car.color, car.dir);
        });
      }

      // Score popups
      popupsRef.current.forEach(p => {
        const alpha = Math.max(0, 1 - p.age);
        const sy = wts(p.wy) - p.age * 50;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.fillText('+100', p.x, sy);
        ctx.restore();
      });

      // Chicken
      const csy = wts(laneWorldY(chickRef.current.lane));
      drawChicken(ctx, chickRef.current.x, csy, chickDirRef.current, chickBobRef.current, isDead.current);

      // Idle overlay
      if (phase === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fillRect(0, 0, W, H);

        const pulse = 0.88 + Math.sin(t / 380) * 0.12;
        ctx.save();
        ctx.strokeStyle = `rgba(255,215,0,${pulse * 0.55})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 - 28, 44 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        drawChicken(ctx, W / 2, H / 2 - 28, 'up', Math.sin(t / 280) * 5, false, 1.3);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px "Bebas Neue", Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255,215,0,0.55)';
        ctx.shadowBlur = 14;
        ctx.fillText('TAP TO START', W / 2, H / 2 + 42);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Cross the road · Top the board · Win SOL', W / 2, H / 2 + 64);

        // Keyboard hints (desktop only)
        if (W > 500) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText('Arrow keys / WASD to move', W / 2, H / 2 + 88);
        }
      }

      // Dead: subtle red vignette
      if (phase === 'dead') {
        const rad = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
        rad.addColorStop(0, 'transparent');
        rad.addColorStop(1, 'rgba(220,30,30,0.3)');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [setPhase, sounds]);

  const handlePointerDown = useCallback(() => {
    if (phaseRef.current === 'idle') startGame();
  }, [startGame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ touchAction: 'none', cursor: 'pointer' }}
      onPointerDown={handlePointerDown}
    />
  );
}
