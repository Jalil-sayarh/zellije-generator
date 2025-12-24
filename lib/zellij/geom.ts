// Exact port of Kaplan's geom.js

export interface Point {
  x: number;
  y: number;
}

export type AffineMatrix = [number, number, number, number, number, number];

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function makePoint(x: number, y: number): Point {
  return { x, y };
}

export function makeAffine(a: number, b: number, c: number, d: number, e: number, f: number): AffineMatrix {
  return [a, b, c, d, e, f];
}

export function makeBox(x: number, y: number, w: number, h: number): Box {
  return { x, y, w, h };
}

export function pointAdd(p: Point, q: Point): Point {
  return { x: p.x + q.x, y: p.y + q.y };
}

export function pointSub(p: Point, q: Point): Point {
  return { x: p.x - q.x, y: p.y - q.y };
}

export function pointScale(p: Point, a: number): Point {
  return { x: p.x * a, y: p.y * a };
}

export function dot(p: Point, q: Point): number {
  return p.x * q.x + p.y * q.y;
}

export function pointDist(p: Point, q: Point): number {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function inv(T: AffineMatrix): AffineMatrix {
  const det = T[0] * T[4] - T[1] * T[3];
  return makeAffine(
    T[4] / det, -T[1] / det, (T[1] * T[5] - T[2] * T[4]) / det,
    -T[3] / det, T[0] / det, (T[2] * T[3] - T[0] * T[5]) / det
  );
}

export function mul(A: AffineMatrix, B: Point): Point;
export function mul(A: AffineMatrix, B: AffineMatrix): AffineMatrix;
export function mul(A: AffineMatrix, B: Point | AffineMatrix): Point | AffineMatrix {
  if ('x' in B) {
    // Matrix * Point
    return {
      x: A[0] * B.x + A[1] * B.y + A[2],
      y: A[3] * B.x + A[4] * B.y + A[5]
    };
  } else {
    // Matrix * Matrix
    return [
      A[0] * B[0] + A[1] * B[3],
      A[0] * B[1] + A[1] * B[4],
      A[0] * B[2] + A[1] * B[5] + A[2],
      A[3] * B[0] + A[4] * B[3],
      A[3] * B[1] + A[4] * B[4],
      A[3] * B[2] + A[4] * B[5] + A[5]
    ];
  }
}

export function matchSeg(p: Point, q: Point): AffineMatrix {
  return makeAffine(
    q.x - p.x, p.y - q.y, p.x,
    q.y - p.y, q.x - p.x, p.y
  );
}

export function matchTwoSegs(p1: Point, q1: Point, p2: Point, q2: Point): AffineMatrix {
  return mul(matchSeg(p2, q2), inv(matchSeg(p1, q1)));
}

// Get an affine transformation that allows box b1 to fill
// box b2, possibly with a 90 degree rotation for better fit.
export function fillBox(b1: Box, b2: Box, rot: boolean): AffineMatrix {
  const sc = Math.min(b2.w / b1.w, b2.h / b1.h);
  const rsc = Math.min(b2.w / b1.h, b2.h / b1.w);

  if (!rot || sc > rsc) {
    // Scale without rotation.
    return mul(
      makeAffine(1, 0, b2.x + 0.5 * b2.w, 0, 1, b2.y + 0.5 * b2.h),
      mul(
        makeAffine(sc, 0, 0, 0, sc, 0),
        makeAffine(1, 0, -(b1.x + 0.5 * b1.w), 0, 1, -(b1.y + 0.5 * b1.h))
      )
    );
  } else {
    // Scale with rotation.
    return mul(
      makeAffine(1, 0, b2.x + 0.5 * b2.w, 0, 1, b2.y + 0.5 * b2.h),
      mul(
        mul(
          makeAffine(rsc, 0, 0, 0, rsc, 0),
          makeAffine(0, -1, 0, 1, 0, 0)
        ),
        makeAffine(1, 0, -(b1.x + 0.5 * b1.w), 0, 1, -(b1.y + 0.5 * b1.h))
      )
    );
  }
}

export function groupTiles(tiles: Point[][]): Point[] {
  // Build a list of segments, eliminating matching pairs.
  let segs: [Point, Point][] = [];
  
  for (const t of tiles) {
    const len = t.length;
    for (let idx = 0; idx < len; idx++) {
      const P = t[idx];
      const Q = t[(idx + 1) % len];
      let found = -1;

      // If this segment already exists in the opposite orientation, 
      // don't add it again.
      for (let sidx = 0; sidx < segs.length; sidx++) {
        const s = segs[sidx];
        if (pointDist(s[0], Q) < 0.0001 && pointDist(s[1], P) < 0.0001) {
          found = sidx;
          break;
        }
      }

      if (found >= 0) {
        // Eliminate the match too.
        segs.splice(found, 1);
      } else {
        segs.push([P, Q]);
      }
    }
  }

  // Now reconstruct the boundary from the remaining segments.
  const ret: Point[] = [segs[0][0]];
  let last = segs[0][1];
  segs = segs.slice(1);

  while (segs.length > 0) {
    for (let idx = 0; idx < segs.length; idx++) {
      if (pointDist(segs[idx][0], last) < 0.0001) {
        ret.push(segs[idx][0]);
        last = segs[idx][1];
        segs.splice(idx, 1);
        break;
      }
    }
  }

  return ret;
}

