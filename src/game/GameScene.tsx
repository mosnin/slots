'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSounds } from './sounds/useSounds';
import { useMobileControls } from './hooks/useMobileControls';
import { useKeyboardControls } from './hooks/useKeyboardControls';

// ── Constants ──────────────────────────────────────────────────────────────
const LANE_H = 58;
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

// Spawn the cars for a single road lane. Lanes are spawned on demand as the
// chicken advances, so the world is effectively infinite. Difficulty scales
// with depth (more, faster cars) and is capped so deep lanes stay possible.
function spawnCarsForLane(lane: number, canvasW: number, nextId: () => number): Car[] {
  if (getLaneType(lane) !== 'road') return [];
  const diff = Math.min(1, lane / 45);
  const count = 2 + Math.floor(diff * 4); // 2-6
  const baseSpeed = 55 + diff * 150;      // 55-205 px/s
  const dir: 1 | -1 = lane % 2 === 0 ? 1 : -1;
  const cars: Car[] = [];
  for (let c = 0; c < count; c++) {
    cars.push({
      id: nextId(),
      lane,
      x: (c / count) * (canvasW + 500) - 100 + Math.random() * 40,
      speed: baseSpeed * (0.8 + Math.random() * 0.4),
      dir,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      w: 60 + Math.floor(Math.random() * 38),
      h: 30,
    });
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

function shade(hex: string, amt: number): string {
  // amt > 0 lightens, < 0 darkens
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

function drawCar(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, dir: 1 | -1) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  // The car travels along X, so w = car length, h = car width.

  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  roundRect(ctx, x + 2, y + 4, w, h, h * 0.4);
  ctx.fill();

  // Wheels — poke out top & bottom edges, near front & rear
  ctx.fillStyle = '#15151a';
  const wheelW = w * 0.16;
  const wheelH = 5;
  [w * 0.16, w * 0.66].forEach((wx) => {
    roundRect(ctx, x + wx, y - 2, wheelW, wheelH, 2);
    ctx.fill();
    roundRect(ctx, x + wx, y + h - wheelH + 2, wheelW, wheelH, 2);
    ctx.fill();
  });

  // Body with a length-wise gradient for a rounded, glossy look
  const bodyGrad = ctx.createLinearGradient(0, y, 0, y + h);
  bodyGrad.addColorStop(0, shade(color, 35));
  bodyGrad.addColorStop(0.5, color);
  bodyGrad.addColorStop(1, shade(color, -35));
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, x, y, w, h, h * 0.42);
  ctx.fill();

  // Hood/nose taper at the front (so it reads as a car, not a brick)
  const noseX = dir === 1 ? x + w * 0.82 : x + w * 0.02;
  ctx.fillStyle = shade(color, -15);
  roundRect(ctx, noseX, y + h * 0.16, w * 0.16, h * 0.68, h * 0.3);
  ctx.fill();

  // Cabin / windows (glass)
  const glass = ctx.createLinearGradient(0, y, 0, y + h);
  glass.addColorStop(0, 'rgba(180,225,255,0.85)');
  glass.addColorStop(1, 'rgba(70,110,150,0.9)');
  ctx.fillStyle = glass;
  // windshield + rear window: two panes with a roof bar between
  const cabX = x + w * 0.30;
  const cabW = w * 0.40;
  roundRect(ctx, cabX, y + h * 0.18, cabW * 0.42, h * 0.64, 3);
  ctx.fill();
  roundRect(ctx, cabX + cabW * 0.58, y + h * 0.18, cabW * 0.42, h * 0.64, 3);
  ctx.fill();

  // Roof highlight strip
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, x + w * 0.12, y + h * 0.40, w * 0.76, h * 0.18, 3);
  ctx.fill();

  // Side mirrors
  ctx.fillStyle = shade(color, -25);
  const mirX = dir === 1 ? cabX - 2 : cabX + cabW;
  ctx.fillRect(mirX, y - 1, 4, 3);
  ctx.fillRect(mirX, y + h - 2, 4, 3);

  // Headlights (front) + taillights (rear)
  const frontX = dir === 1 ? x + w - 3 : x + 3;
  const rearX = dir === 1 ? x + 3 : x + w - 3;
  ctx.fillStyle = 'rgba(255,248,200,0.98)';
  ctx.shadowColor = '#fff7c0';
  ctx.shadowBlur = 7;
  ctx.beginPath(); ctx.arc(frontX, y + h * 0.28, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(frontX, y + h * 0.72, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,60,40,0.9)';
  ctx.beginPath(); ctx.arc(rearX, y + h * 0.28, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rearX, y + h * 0.72, 2.2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// A wooden log lying across a safe lane
function drawLog(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  // body
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#a9784a');
  g.addColorStop(0.5, '#8a5a32');
  g.addColorStop(1, '#6e451f');
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, h * 0.5);
  ctx.fill();

  // bark grain lines
  ctx.strokeStyle = 'rgba(70,40,18,0.5)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + h * 0.6, y + (h * i) / 3);
    ctx.lineTo(x + w - h * 0.6, y + (h * i) / 3);
    ctx.stroke();
  }

  // cut-end rings on both ends
  [x + h * 0.5, x + w - h * 0.5].forEach((ex) => {
    ctx.fillStyle = '#c79a63';
    ctx.beginPath(); ctx.ellipse(ex, y + h / 2, h * 0.42, h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(110,69,31,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(ex, y + h / 2, h * 0.26, h * 0.26, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(ex, y + h / 2, h * 0.12, h * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
  });
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
  const spawnedLanesRef = useRef<Set<number>>(new Set());
  const carIdRef = useRef(0);
  const cloudsRef = useRef<Cloud[]>(makeClouds());
  const popupsRef = useRef<Popup[]>([]);
  const chickRef = useRef({ x: 240, lane: 0 });
  const chickDirRef = useRef<Dir>('up');
  const chickBobRef = useRef(0);
  const chickMoveRef = useRef(false);
  const camYRef = useRef(0);
  const scrollFloorRef = useRef(-LANE_H * 2); // world Y of the kill boundary (rises over time)
  const scrollTimeRef = useRef(0);             // seconds spent playing (drives ramp)
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
    scrollFloorRef.current = -LANE_H * 2;
    scrollTimeRef.current = 0;
    popupsRef.current = [];
    carsRef.current = [];
    spawnedLanesRef.current = new Set();
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

        // Infinite world: spawn lanes in a window around the chicken and
        // despawn ones far outside it.
        {
          const cl = chickRef.current.lane;
          const ahead = Math.ceil((H * 0.62) / LANE_H) + 4;
          const behind = Math.ceil((H * 0.45) / LANE_H) + 4;
          const minLane = cl - behind;
          const maxLane = cl + ahead;
          for (let l = Math.max(1, minLane); l <= maxLane; l++) {
            if (getLaneType(l) === 'road' && !spawnedLanesRef.current.has(l)) {
              spawnedLanesRef.current.add(l);
              carsRef.current.push(
                ...spawnCarsForLane(l, W, () => carIdRef.current++)
              );
            }
          }
          carsRef.current = carsRef.current.filter(
            (c) => c.lane >= minLane - 2 && c.lane <= maxLane + 2
          );
          spawnedLanesRef.current.forEach((l) => {
            if (l < minLane - 2 || l > maxLane + 2) spawnedLanesRef.current.delete(l);
          });
        }

        // Bob
        chickBobRef.current = Math.sin(t / 90) * (chickMoveRef.current ? 4 : 1.2);

        // Rising kill floor: advances upward at an accelerating pace.
        // The camera still follows the chicken normally; the floor is a
        // separate world-Y boundary — if the chicken falls below it, they die.
        scrollTimeRef.current += dt;
        const scrollSpeed = Math.min(
          LANE_H * 1.6,                          // cap ~93 world-units/s
          6 + scrollTimeRef.current * 0.55       // ~6 at t=0, ~60 at t=98 s
        );
        scrollFloorRef.current += scrollSpeed * dt;

        // Kill if the chicken's lane has been swallowed by the floor
        if (laneWorldY(chickRef.current.lane) < scrollFloorRef.current - LANE_H * 0.5) {
          isDead.current = true;
          sounds.playSquash();
          setPhase('dead');
        }

        // Smooth camera — follow the chicken (independent of the floor)
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

      for (let i = Math.max(0, botLane); i <= topLane; i++) {
        const wy = laneWorldY(i);
        const sy = wts(wy);
        const top = sy - LANE_H / 2;
        const type = getLaneType(i);

        if (type === 'safe') {
          const g = ctx.createLinearGradient(0, top, 0, top + LANE_H);
          g.addColorStop(0, '#6cb83f');
          g.addColorStop(1, '#539a33');
          ctx.fillStyle = g;
          ctx.fillRect(0, top, W, LANE_H);

          // Grass tufts (little V blades, deterministic per lane)
          ctx.strokeStyle = 'rgba(40,110,30,0.45)';
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          for (let fx = 12 + ((i * 31) % 26); fx < W; fx += 34) {
            const gy = top + 10 + ((fx * 7 + i * 13) % (LANE_H - 20));
            ctx.beginPath();
            ctx.moveTo(fx, gy); ctx.lineTo(fx - 2.5, gy - 5);
            ctx.moveTo(fx, gy); ctx.lineTo(fx + 2.5, gy - 5);
            ctx.moveTo(fx, gy); ctx.lineTo(fx, gy - 6);
            ctx.stroke();
          }

          // Wooden logs lying across the bank (1-2 per safe lane)
          const logCount = i % 8 === 0 ? 2 : 1;
          for (let l = 0; l < logCount; l++) {
            const seed = (i * 97 + l * 251) % 100;
            const logW = 70 + (seed % 60);
            const lx = ((seed * 53) % Math.max(1, W - logW));
            drawLog(ctx, lx, top + LANE_H / 2 - 9 + (l ? 6 : -6), logW, 18);
          }

          // Soil edge stripes
          ctx.fillStyle = 'rgba(90,160,55,0.7)';
          ctx.fillRect(0, top, W, 3);
          ctx.fillStyle = 'rgba(60,40,22,0.4)';
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

      // Rising lava floor — unmistakably deadly
      if (phase === 'playing' && !isDead.current) {
        const floorScreenY = wts(scrollFloorRef.current);
        const lavaTop = Math.max(0, floorScreenY - 4);

        if (lavaTop < H + 40) {
          // Lava body below the floor line
          const lavaGrad = ctx.createLinearGradient(0, lavaTop, 0, H);
          lavaGrad.addColorStop(0, '#ff6a00');
          lavaGrad.addColorStop(0.35, '#e63600');
          lavaGrad.addColorStop(1, '#7a0000');
          ctx.fillStyle = lavaGrad;
          ctx.fillRect(0, lavaTop, W, H - lavaTop);

          // Animated lava blobs along the surface
          ctx.save();
          const blobCount = Math.ceil(W / 38);
          for (let b = 0; b < blobCount; b++) {
            const bx = (b / blobCount) * W + ((t / 900 + b * 0.37) % 1) * (W / blobCount);
            const by = lavaTop - 6 + Math.sin(t / 400 + b * 1.7) * 5;
            ctx.beginPath();
            ctx.ellipse(bx, by, 14 + Math.sin(b * 2.1) * 5, 9 + Math.sin(b) * 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = b % 2 === 0 ? '#ff8c00' : '#ff5500';
            ctx.fill();
          }
          ctx.restore();

          // Bright glowing rim
          ctx.save();
          ctx.shadowColor = '#ff6a00';
          ctx.shadowBlur = 18;
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, lavaTop);
          ctx.lineTo(W, lavaTop);
          ctx.stroke();
          ctx.restore();

          // Danger gradient overlay above the floor so it bleeds upward
          if (floorScreenY > 0) {
            const warnH = Math.min(90, floorScreenY);
            const warnGrad = ctx.createLinearGradient(0, floorScreenY - warnH, 0, floorScreenY);
            warnGrad.addColorStop(0, 'rgba(255,80,0,0)');
            warnGrad.addColorStop(1, 'rgba(255,80,0,0.18)');
            ctx.fillStyle = warnGrad;
            ctx.fillRect(0, floorScreenY - warnH, W, warnH);
          }
        }
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
