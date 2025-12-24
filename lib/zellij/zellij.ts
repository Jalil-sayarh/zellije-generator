// Exact port of Kaplan's index.js
// Only dynamic parameters: color palette and shimmer

import {
  Point,
  AffineMatrix,
  makePoint,
  makeAffine,
  makeBox,
  pointAdd,
  pointSub,
  pointScale,
  pointDist,
  dot,
  mul,
  matchTwoSegs,
  fillBox,
  groupTiles
} from './geom';
import { fillers } from './fillers';

// Types
interface Line {
  pos: Point;
  dir: Point;
}

interface Tile {
  vertex: Point;
  path: Point[];
}

interface GridCell {
  users: Line[];
  drawn: boolean;
  group: number;
}

interface DrawnShape {
  path: Point[];
  color: string;
}

// Module state
let GRID_SIDE: number;
let LINE_DENSITY: number;
let NUM_LINES: number;
let FOCUS: 'None' | 'Eight' | 'Sixteen';
let SHIMMER: number;

let lines: Line[];
let grid: GridCell[];
let groups: Point[][];
let tiles: Tile[];
let boundary: Point[];

// Random state
let randSeed: number;
function myrand(): number {
  // Simple seeded random (LCG)
  randSeed = (randSeed * 1664525 + 1013904223) % 4294967296;
  return randSeed / 4294967296;
}

const ordered_dirs = [5, 2, 1, 0, 3, 6, 7, 8];
const r22 = Math.sqrt(2.0) * 0.5;
const int_dir_vecs: Point[] = [
  makePoint(-1, -1), makePoint(0, -1), makePoint(1, -1),
  makePoint(-1, 0), makePoint(0, 0), makePoint(1, 0),
  makePoint(-1, 1), makePoint(0, 1), makePoint(1, 1)
];
const dir_vecs: Point[] = [
  makePoint(-r22, -r22), makePoint(0, -1), makePoint(r22, -r22),
  makePoint(-1, 0), makePoint(0, 0), makePoint(1, 0),
  makePoint(-r22, r22), makePoint(0, 1), makePoint(r22, r22)
];

// Grid class methods as functions
function getCell(pt: Point): GridCell {
  return grid[pt.y * GRID_SIDE + pt.x];
}

function getUsers(pt: Point): Line[] {
  return getCell(pt).users;
}

function numUsers(pt: Point): number {
  return getUsers(pt).length;
}

function addUser(pt: Point, line: Line): void {
  getCell(pt).users.push(line);
}

function clearDrawn(): void {
  for (const c of grid) {
    c.drawn = false;
  }
}

function isDrawn(pt: Point): boolean {
  return getCell(pt).drawn;
}

function setDrawn(pt: Point): void {
  getCell(pt).drawn = true;
}

function getGroup(pt: Point): number {
  return getCell(pt).group;
}

function setGroup(pt: Point, g: number): void {
  getCell(pt).group = g;
}

function markRay(line: Line, pos: Point, dir: Point): void {
  while (pos.x >= 0 && pos.x < GRID_SIDE && pos.y >= 0 && pos.y < GRID_SIDE) {
    addUser(pos, line);
    pos = pointAdd(pos, dir);
  }
}

function markLine(line: Line): void {
  const p = line.pos;
  const d = line.dir;
  markRay(line, p, d);
  markRay(line, pointSub(p, d), pointScale(d, -1));
}

function markLines(lns: Line[]): void {
  for (const l of lns) {
    markLine(l);
  }
}

function findNeighbour(pt: Point, dir: Point): Point | null {
  pt = pointAdd(pt, dir);
  while (pt.x >= 0 && pt.x < GRID_SIDE && pt.y >= 0 && pt.y < GRID_SIDE) {
    if (numUsers(pt) > 1) {
      return pt;
    }
    pt = pointAdd(pt, dir);
  }
  return null;
}

function createLines(num: number): { lines: Line[]; groups: Point[][] } {
  const all_lines: Line[] = [];
  const keep_lines: Line[] = [];
  const grps: Point[][] = [];

  function makeLine(pos: Point, dir: Point): Line {
    return { pos, dir };
  }

  function makeAllLines(n: number): void {
    // Horizontal lines, emanating from left edge
    for (let i = 0; i < n + 1; ++i) {
      all_lines.push(makeLine(makePoint(0, 2 * i), makePoint(1, 0)));
    }

    // Vertical lines, emanating from top edge
    for (let i = 0; i < n + 1; ++i) {
      all_lines.push(makeLine(makePoint(2 * i, 0), makePoint(0, 1)));
    }

    // Slope -1 lines. n pointing NW, n+1 pointing SE
    for (let i = 0; i < n + 1; ++i) {
      all_lines.push(makeLine(makePoint(2 * n, 2 * i), makePoint(-1, -1)));
    }
    for (let i = 0; i < n; ++i) {
      all_lines.push(makeLine(makePoint(0, 2 * i + 2), makePoint(1, 1)));
    }

    // Slope 1 lines. n+1 pointing NE, n pointing SW
    for (let i = 0; i < n + 1; ++i) {
      all_lines.push(makeLine(makePoint(0, 2 * i), makePoint(1, -1)));
    }
    for (let i = 0; i < n; ++i) {
      all_lines.push(makeLine(makePoint(2 * i + 2, 2 * n), makePoint(1, -1)));
    }
  }

  function makeRandomStar(n: number): void {
    const ax = Math.floor(myrand() * (n - 4)) + 2;
    const ay = Math.floor(myrand() * (n - 4)) + 2;

    const plan = [
      { idx: 4 * n + 7 + ax + ay, keep: false },
      { idx: 4 * n + 6 + ax + ay, keep: true },
      { idx: 4 * n + 5 + ax + ay, keep: false },
      { idx: 4 * n + 4 + ax + ay, keep: false },
      { idx: 4 * n + 3 + ax + ay, keep: false },
      { idx: 4 * n + 2 + ax + ay, keep: true },
      { idx: 4 * n + 1 + ax + ay, keep: false },

      { idx: 3 * n + 5 + ax - ay, keep: false },
      { idx: 3 * n + 4 + ax - ay, keep: true },
      { idx: 3 * n + 3 + ax - ay, keep: false },
      { idx: 3 * n + 2 + ax - ay, keep: false },
      { idx: 3 * n + 1 + ax - ay, keep: false },
      { idx: 3 * n + 0 + ax - ay, keep: true },
      { idx: 3 * n - 1 + ax - ay, keep: false },

      { idx: n + 1 + ay + 2, keep: true },
      { idx: n + 1 + ay + 1, keep: false },
      { idx: n + 1 + ay, keep: false },
      { idx: n + 1 + ay - 1, keep: true },

      { idx: ax + 2, keep: true },
      { idx: ax + 1, keep: false },
      { idx: ax, keep: false },
      { idx: ax - 1, keep: true }
    ];

    for (const step of plan) {
      if (step.keep) {
        keep_lines.push(all_lines[step.idx]);
      }
      all_lines.splice(step.idx, 1);
    }

    grps.push([
      makePoint(2 * ay + 1, 2 * ax - 3),
      makePoint(2 * ay - 2, 2 * ax - 2),
      makePoint(2 * ay, 2 * ax - 2),
      makePoint(2 * ay + 2, 2 * ax - 2),
      makePoint(2 * ay + 4, 2 * ax - 2),
      makePoint(2 * ay - 2, 2 * ax),
      makePoint(2 * ay + 4, 2 * ax),
      makePoint(2 * ay - 3, 2 * ax + 1),
      makePoint(2 * ay + 5, 2 * ax + 1),
      makePoint(2 * ay - 2, 2 * ax + 2),
      makePoint(2 * ay + 4, 2 * ax + 2),
      makePoint(2 * ay - 2, 2 * ax + 4),
      makePoint(2 * ay, 2 * ax + 4),
      makePoint(2 * ay + 2, 2 * ax + 4),
      makePoint(2 * ay + 4, 2 * ax + 4),
      makePoint(2 * ay + 1, 2 * ax + 5)
    ]);
  }

  function makeRandom2x2(n: number): void {
    if (myrand() < 0.5) {
      const ax = Math.floor(myrand() * n);
      const ay = Math.floor(myrand() * n);

      const rem: number[] = [];

      for (let i = 0; i < 3; ++i) {
        const k = (2 * n + 2) + (n - 1) + ax - ay;
        if (k >= 2 * n + 2 && k < 4 * n + 3) {
          rem.push(k);
        }
      }

      for (let i = 0; i < 3; ++i) {
        const k = 4 * n + 3 + i + ax + ay;
        rem.push(k);
      }

      rem.reverse();
      for (const i of rem) {
        all_lines.splice(i, 1);
      }

      grps.push([
        makePoint(2 * ay, 2 * ax),
        makePoint(2 * ay + 2, 2 * ax),
        makePoint(2 * ay, 2 * ax + 2),
        makePoint(2 * ay + 2, 2 * ax + 2)
      ]);

      for (const i of [n + 1 + ay + 1, n + 1 + ay, ax + 1, ax]) {
        keep_lines.push(all_lines[i]);
        all_lines.splice(i, 1);
      }
    } else {
      const a = Math.floor(myrand() * n);
      const b = Math.floor(myrand() * (n - 1)) + 1;

      if (myrand() < 0.5) {
        all_lines.splice(n + 1 + a + 1, 1);
        all_lines.splice(n + 1 + a, 1);
        all_lines.splice(b, 1);
        grps.push([
          makePoint(2 * a + 1, 2 * b - 1),
          makePoint(2 * a + 1, 2 * b + 1),
          makePoint(2 * a, 2 * b),
          makePoint(2 * a + 2, 2 * b)
        ]);

        for (const i of [4 * n + a + b + 1, 4 * n + a + b, 3 * n - 1 + b - a, 3 * n - 2 + b - a]) {
          keep_lines.push(all_lines[i]);
          all_lines.splice(i, 1);
        }
      } else {
        all_lines.splice(n + 1 + b, 1);
        all_lines.splice(a + 1, 1);
        all_lines.splice(a, 1);
        grps.push([
          makePoint(2 * b, 2 * a),
          makePoint(2 * b, 2 * a + 2),
          makePoint(2 * b - 1, 2 * a + 1),
          makePoint(2 * b + 1, 2 * a + 1)
        ]);

        for (const i of [4 * n + a + b + 1, 4 * n + a + b, 3 * n + a - b, 3 * n - 1 + a - b]) {
          keep_lines.push(all_lines[i]);
          all_lines.splice(i, 1);
        }
      }
    }
  }

  makeAllLines(LINE_DENSITY);
  
  if (FOCUS === 'Eight') {
    makeRandom2x2(LINE_DENSITY);
  } else if (FOCUS === 'Sixteen') {
    makeRandomStar(LINE_DENSITY);
  }

  // Discount the lines you've already used.
  num -= keep_lines.length;

  while (all_lines.length > 0 && num > 0) {
    const ri = Math.floor(myrand() * all_lines.length);
    keep_lines.push(all_lines[ri]);
    all_lines.splice(ri, 1);
    --num;
  }

  return { lines: keep_lines, groups: grps };
}

function getAllTiles(): { tiles: Tile[]; boundary: Point[] } {
  const L: Tile[] = [];
  const B: Point[] = [];

  let spt: Point | null = null;

  for (let y = 0; y < GRID_SIDE; ++y) {
    for (let x = 0; x < GRID_SIDE; ++x) {
      const pt = makePoint(x, y);
      const l = numUsers(pt);
      if (l >= 2) {
        spt = pt;
        break;
      }
    }
    if (spt !== null) {
      break;
    }
  }

  if (spt === null) {
    return { tiles: L, boundary: B };
  }

  const stack: Array<{ pos: Point; ap: Point | null; aq: Point | null }> = [
    { pos: spt, ap: null, aq: null }
  ];

  while (stack.length > 0) {
    const a = stack.pop()!;
    const pt = a.pos;

    if (isDrawn(pt)) {
      continue;
    }

    const align_p = a.ap;
    const align_q = a.aq;

    const us = getUsers(pt);
    const pts: Point[] = [];

    setDrawn(pt);

    const used_dirs = new Set<number>();

    for (const l of us) {
      const d = l.dir;
      used_dirs.add((d.y + 1) * 3 + (d.x + 1));
      used_dirs.add((-d.y + 1) * 3 + (-d.x + 1));
    }

    // First, compute the polygon we want to draw.
    let last = makePoint(0, 0);
    for (const d of ordered_dirs) {
      if (used_dirs.has(d)) {
        const ddir = dir_vecs[d];
        const ppdir = makePoint(-ddir.y, ddir.x);
        const npt = pointAdd(last, ppdir);
        pts.push(last);
        last = npt;
      }
    }

    // Now, figure out the translation vector
    let translation = makePoint(0, 0);
    if (align_p !== null && align_q !== null) {
      const delt = pointSub(align_p, align_q);
      for (let idx = 0; idx < pts.length; ++idx) {
        const v = pointSub(pts[(idx + 1) % pts.length], pts[idx]);
        if (pointDist(v, delt) < 1e-5) {
          translation = pointSub(align_q, pts[idx]);
          break;
        }
      }
    }

    // Rewrite the points according to the translation.
    for (let idx = 0; idx < pts.length; ++idx) {
      pts[idx] = pointAdd(pts[idx], translation);
    }

    L.push({ vertex: pt, path: pts });

    // Finally, recursively walk to your neighbours
    let vidx = 0;
    for (const d of ordered_dirs) {
      if (used_dirs.has(d)) {
        const neigh = findNeighbour(pt, int_dir_vecs[d]);
        if (neigh !== null) {
          if (!isDrawn(neigh)) {
            stack.push({
              pos: neigh,
              ap: pts[vidx],
              aq: pts[(vidx + 1) % pts.length]
            });
          }
        } else {
          // No neighbour, so these points are part of the boundary.
          B.push(pts[vidx]);
          B.push(pts[(vidx + 1) % pts.length]);
        }
        vidx = vidx + 1;
      }
    }
  }

  return { tiles: L, boundary: B };
}

function buildDesign(): void {
  const lineinfo = createLines(NUM_LINES);
  lines = lineinfo.lines;
  groups = lineinfo.groups;

  // Initialize grid
  grid = [];
  for (let idx = 0; idx < GRID_SIDE * GRID_SIDE; ++idx) {
    grid.push({ users: [], drawn: false, group: -1 });
  }

  markLines(lines);

  const all = getAllTiles();
  tiles = all.tiles;
  boundary = all.boundary;

  for (let idx = 0; idx < groups.length; ++idx) {
    for (const pt of groups[idx]) {
      setGroup(pt, idx);
    }
    const grouptiles: Point[][] = [];
    for (let tidx = tiles.length - 1; tidx >= 0; --tidx) {
      const t = tiles[tidx];
      if (getGroup(t.vertex) === idx) {
        grouptiles.push(t.path);
        tiles.splice(tidx, 1);
      }
    }
    const newtile = groupTiles(grouptiles);
    tiles.push({ vertex: makePoint(0, 0), path: newtile });
  }
}

function getSignature(t: Point[]): string {
  const l = t.length;
  let ret = '';

  for (let i = 0; i < l; ++i) {
    const a = t[(i + l - 1) % l];
    const b = t[i];
    const c = t[(i + 1) % l];
    const s = dot(pointSub(a, b), pointSub(c, b));
    if (Math.abs(s) < 0.0001) {
      ret = ret + 'L';
    } else if (Math.abs(1 + s) < 0.0001) {
      ret = ret + 'I';
    } else if (s > 0) {
      ret = ret + 'V';
    } else {
      ret = ret + 'C';
    }
  }

  return ret;
}

// HSB to RGB conversion
function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  h = h % 1;
  s = Math.max(0, Math.min(1, s));
  b = Math.max(0, Math.min(1, b));

  if (s === 0) {
    const v = Math.round(b * 255);
    return [v, v, v];
  }

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  let r: number, g: number, bb: number;
  switch (i % 6) {
    case 0: r = b; g = t; bb = p; break;
    case 1: r = q; g = b; bb = p; break;
    case 2: r = p; g = b; bb = t; break;
    case 3: r = p; g = q; bb = b; break;
    case 4: r = t; g = p; bb = b; break;
    case 5: r = b; g = p; bb = q; break;
    default: r = 0; g = 0; bb = 0;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(bb * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Color manipulation for shimmer
function hexToHsb(hex: string): { h: number; s: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h, s, b: v };
}

function applyShimmer(hex: string, shimmerLevel: number): string {
  if (shimmerLevel < 0) return hex;
  
  // Scale shimmer intensity based on level (2, 3, 4)
  // Level 2: subtle (±15%), Level 3: medium (±25%), Level 4: strong (±35%)
  const intensity = shimmerLevel * 0.15;  // 0.30, 0.45, 0.60
  
  const hsb = hexToHsb(hex);
  // Apply brightness variation scaled by intensity
  const variation = (myrand() - 0.5) * intensity;
  const newB = Math.max(0, Math.min(1, hsb.b + variation));
  
  // Also add saturation variation for more natural look
  const satVariation = (myrand() - 0.5) * (intensity * 0.5);
  const newS = Math.max(0, Math.min(1, hsb.s + satVariation));
  
  const [r, g, b] = hsbToRgb(hsb.h, newS, newB);
  return rgbToHex(r, g, b);
}

// Main render function
export interface RenderOptions {
  seed: number;
  width: number;
  height: number;
  palette: string[];  // Array of hex colors
  shimmer: number;    // -1 = off, 2-4 = shimmer amount
}

export interface RenderedShape {
  path: Point[];
  color: string;
}

export function generateZellij(options: RenderOptions): RenderedShape[] {
  const { seed, width, height, palette, shimmer } = options;

  // Initialize random seed
  randSeed = seed;

  // Initialize features (from Kaplan's initFeatures)
  let v = myrand();
  if (v < 0.7) {
    LINE_DENSITY = 10;
    NUM_LINES = 25;
  } else if (v < 0.9) {
    LINE_DENSITY = 6;
    NUM_LINES = 9;
  } else {
    LINE_DENSITY = 20;
    NUM_LINES = 40;
  }

  v = myrand();
  if (v < 0.75) {
    FOCUS = 'None';
  } else if (v < 0.95) {
    FOCUS = 'Eight';
  } else {
    FOCUS = 'Sixteen';
  }

  SHIMMER = shimmer;
  GRID_SIDE = (2 * LINE_DENSITY) + 1;

  // Build the design
  buildDesign();

  // Calculate bounding box
  let xmin = 100000.0;
  let xmax = -100000.0;
  let ymin = 100000.0;
  let ymax = -100000.0;

  for (const pt of boundary) {
    xmin = Math.min(xmin, pt.x);
    xmax = Math.max(xmax, pt.x);
    ymin = Math.min(ymin, pt.y);
    ymax = Math.max(ymax, pt.y);
  }

  const cbox = makeBox(xmin, ymin, xmax - xmin, ymax - ymin);
  const sbox = makeBox(60, 60, width - 120, height - 120);
  const M = fillBox(cbox, sbox, false);

  const drawnShapes: RenderedShape[] = [];

  // Draw tiles
  for (const t of tiles) {
    drawTile(M, t.path, palette, drawnShapes);
  }

  return drawnShapes;
}

function drawTile(M: AffineMatrix, t: Point[], palette: string[], output: RenderedShape[]): void {
  let lt = [...t];
  
  // Rotate lt by a random amount
  const rl = Math.floor(myrand() * lt.length);
  lt = lt.slice(rl).concat(lt.slice(0, rl));
  let sig = getSignature(lt);
  let found = false;

  // Now rotate one step at a time until the signature is found.
  for (let idx = 0; idx < sig.length; ++idx) {
    if (fillers.hasOwnProperty(sig)) {
      found = true;
      break;
    }
    lt = lt.slice(1).concat(lt.slice(0, 1));
    sig = sig.slice(1) + sig.slice(0, 1);
  }

  if (!found) {
    // console.log("Not found: " + sig);
    return;
  }

  const clusters = fillers[sig];
  const cl = clusters[Math.floor(myrand() * clusters.length)];
  const bds = cl.bounds;
  const fv = makePoint(bds[0], bds[1]);
  const fw = makePoint(bds[2], bds[3]);

  const T = mul(M, matchTwoSegs(fv, fw, lt[0], lt[1]));

  for (const sh of cl.shapes) {
    const pth = sh.path;
    const colIdx = sh.colour;

    // Get color from palette
    let color = palette[Math.min(colIdx, palette.length - 1)];
    
    // Apply shimmer if enabled
    if (SHIMMER >= 0 && colIdx >= 2) {
      color = applyShimmer(color, SHIMMER);
    }

    const dshp: Point[] = [];
    for (let idx = 0; idx < pth.length; idx += 2) {
      const spt = mul(T, makePoint(pth[idx], pth[idx + 1]));
      dshp.push(spt);
    }

    output.push({ path: dshp, color });
  }
}

