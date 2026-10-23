import type { AboutScene } from './AboutScene.ts';
import { withAlpha } from './withAlpha.ts';

/* The camera rides low over the floor toward a vanishing point under the copy's right edge. */
const HORIZON = 0.66;
const FOCAL = 0.5;
const CAMERA_HEIGHT = 1.15;
const CELL = 2;
const NEAR = 0.5;
const FAR = 110;
const LANES = 40;
const WALL = 0.8;
/** Walls fade out this far ahead, so they never swell up in front of the camera. */
const WALL_NEAR = 6;
const SPEED = 0.07;
const WARMUP = 500;

type Point = readonly [x: number, z: number];
type Cycle = { color: string; x: number; z: number; dir: -1 | 0 | 1; left: number; trail: Point[] };

/**
 * TRON: Legacy's Grid: a glowing floor running to a lit horizon and skyline, and two light cycles racing ahead,
 * turning at right angles and leaving light walls that stream past.
 */
export const tronScene: AboutScene = {
  key: 'tron',
  still: 1,
  shade: 'grid',
  start: ({ ctx, width, height, palette }) => {
    const horizon = height * HORIZON;
    const vanish = width / 2;
    const focal = width * FOCAL;
    let camera = 0;

    const project = (x: number, y: number, z: number): [number, number] => {
      const depth = z - camera;
      return [vanish + (x * focal) / depth, horizon + ((CAMERA_HEIGHT - y) * focal) / depth];
    };

    const skyline = Array.from({ length: Math.ceil(width / 24) }, (_, i) => ({
      x: i * 24 + Math.random() * 6,
      w: 10 + Math.random() * 34,
      h: 4 + Math.random() ** 2.4 * 64,
    }));

    const cycles: Cycle[] = [
      { color: palette.cyan, x: -2, z: 16, dir: 0, left: 8, trail: [[-2, NEAR]] },
      { color: palette.red, x: 3, z: 26, dir: 0, left: 5, trail: [[3, NEAR]] },
    ];

    const turn = (cycle: Cycle) => {
      cycle.trail.push([cycle.x, cycle.z]);
      if (cycle.dir !== 0) {
        cycle.dir = 0;
        cycle.left = 4 + Math.random() * 9;
        return;
      }
      cycle.dir = cycle.x > 4 ? -1 : cycle.x < -4 ? 1 : Math.random() < 0.5 ? -1 : 1;
      cycle.left = 1 + Math.random() * 3;
    };

    const ride = (cycle: Cycle) => {
      const ahead = cycle.z - camera;
      const forward = ahead > 32 ? SPEED * 0.55 : ahead < 12 ? SPEED * 1.8 : SPEED * 1.12;
      const step = cycle.dir === 0 ? forward : SPEED * 1.5;
      if (cycle.dir === 0) cycle.z += step;
      else cycle.x += step * cycle.dir;
      cycle.left -= step;
      if (cycle.left <= 0) turn(cycle);
      while (cycle.trail.length > 1 && (cycle.trail[1]?.[1] ?? Infinity) < camera + NEAR) cycle.trail.shift();
    };

    const advance = () => {
      camera += SPEED;
      cycles.forEach(ride);
    };
    Array.from({ length: WARMUP }).forEach(advance);

    const clip = (from: Point, to: Point, z: number): Point =>
      from[1] >= z ? from : [from[0] + ((to[0] - from[0]) * (z - from[1])) / (to[1] - from[1] || 1), z];

    const wall = (color: string, a: Point, b: Point) => {
      const nearest = camera + WALL_NEAR;
      if (a[1] < nearest && b[1] < nearest) return;
      const [from, to] = [clip(a, b, nearest), clip(b, a, nearest)];
      const [a0, b0, a1, b1] = [
        project(from[0], 0, from[1]),
        project(to[0], 0, to[1]),
        project(from[0], WALL, from[1]),
        project(to[0], WALL, to[1]),
      ];
      ctx.fillStyle = withAlpha(color, 0.2);
      ctx.beginPath();
      ctx.moveTo(...a0);
      ctx.lineTo(...b0);
      ctx.lineTo(...b1);
      ctx.lineTo(...a1);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = withAlpha(color, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(...a1);
      ctx.lineTo(...b1);
      ctx.stroke();
      ctx.strokeStyle = withAlpha(color, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(...a0);
      ctx.lineTo(...b0);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const backdrop = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, palette.ink);
      sky.addColorStop(1, withAlpha(palette.cyan, 0.08));
      ctx.fillStyle = palette.ink;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, horizon);
      const glow = ctx.createRadialGradient(vanish, horizon, 0, vanish, horizon, width / 2);
      glow.addColorStop(0, withAlpha(palette.cyan, 0.28));
      glow.addColorStop(0.35, withAlpha(palette.cyan, 0.06));
      glow.addColorStop(1, withAlpha(palette.cyan, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizon - height * 0.4, width, height * 0.6);
      ctx.fillStyle = palette.ink;
      ctx.strokeStyle = withAlpha(palette.cyan, 0.35);
      ctx.lineWidth = 1;
      skyline.forEach(({ x, w, h }) => {
        ctx.fillRect(x, horizon - h, w, h);
        ctx.beginPath();
        ctx.moveTo(x, horizon - h + 0.5);
        ctx.lineTo(x + w, horizon - h + 0.5);
        ctx.stroke();
      });
      ctx.fillStyle = withAlpha(palette.cyan, 0.85);
      ctx.fillRect(0, horizon - 0.5, width, 1);
    };

    const floor = () => {
      ctx.lineWidth = 1;
      Array.from({ length: LANES * 2 + 1 }, (_, i) => (i - LANES) * CELL).forEach((x) => {
        const near = project(x, 0, camera + 2);
        const far = project(x, 0, camera + FAR);
        const line = ctx.createLinearGradient(far[0], far[1], near[0], near[1]);
        line.addColorStop(0, withAlpha(palette.cyan, 0));
        line.addColorStop(0.45, withAlpha(palette.cyan, 0.28));
        line.addColorStop(1, withAlpha(palette.cyan, 0.6));
        ctx.strokeStyle = line;
        ctx.beginPath();
        ctx.moveTo(...far);
        ctx.lineTo(...near);
        ctx.stroke();
      });
      const first = Math.ceil((camera + NEAR) / CELL) * CELL;
      Array.from({ length: Math.ceil(FAR / CELL) }, (_, i) => first + i * CELL)
        .filter((z) => z < camera + FAR)
        .forEach((z) => {
          const y = project(0, 0, z)[1];
          ctx.strokeStyle = withAlpha(palette.cyan, Math.max(0, 1 - (z - camera) / FAR) ** 1.6 * 0.7);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        });
    };

    const lightCycle = (cycle: Cycle) => {
      const points: Point[] = [...cycle.trail, [cycle.x, cycle.z]];
      points.slice(0, -1).forEach((point, i) => wall(cycle.color, point, points[i + 1] ?? point));
      const [x, y] = project(cycle.x, WALL / 2, cycle.z);
      const radius = Math.max(2, (0.35 * focal) / (cycle.z - camera)) * 1.6;
      const head = ctx.createRadialGradient(x, y, 0, x, y, radius);
      head.addColorStop(0, withAlpha(cycle.color, 0.9));
      head.addColorStop(1, withAlpha(cycle.color, 0));
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    return () => {
      advance();
      backdrop();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      floor();
      [...cycles].sort((a, b) => b.z - a.z).forEach(lightCycle);
      ctx.restore();
    };
  },
};
