/**
 * Water contour extraction — PURE module (no Pixi import).
 *
 * Marching squares turns the signed shoreline field (< 0 = water) into smooth
 * closed polygons in TILE space, so water can be drawn as continuous vector
 * shapes with a feathered edge instead of stair-stepped tiles. The caller
 * projects the loops to iso and fills them (with holes for islands).
 *
 * Correctness is validated by unit tests against known fields (disc, annulus)
 * since the renderer can't be eyeballed here.
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** Signed field: negative = inside (water), positive = outside (land). */
export type Field = (x: number, y: number) => number;

interface Segment {
  a: Vec2;
  b: Vec2;
}

function interp(p0: Vec2, v0: number, p1: Vec2, v1: number): Vec2 {
  const t = v0 / (v0 - v1);
  return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
}

function key(p: Vec2): string {
  // Crossing points on a shared grid edge are computed identically from both
  // adjacent cells, so raw values match exactly → safe to key on.
  return `${p.x}|${p.y}`;
}

/**
 * Extract closed water contour loops over the integer grid [0..width]×[0..height].
 * The field is sampled one cell beyond the bounds and treated as land outside,
 * guaranteeing every loop closes.
 */
export function extractWaterContours(width: number, height: number, field: Field): Vec2[][] {
  // Sample once; corners shared between cells.
  const cols = width + 3; // x from -1 .. width+1
  const rows = height + 3; // y from -1 .. height+1
  const val = (gx: number, gy: number): number => {
    if (gx < 0 || gx > width || gy < 0 || gy > height) return 1; // land outside world
    return field(gx, gy);
  };
  const grid = new Float64Array(cols * rows);
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      grid[iy * cols + ix] = val(ix - 1, iy - 1);
    }
  }
  const at = (gx: number, gy: number): number => grid[(gy + 1) * cols + (gx + 1)];

  const segments: Segment[] = [];
  const pushSeg = (a: Vec2, b: Vec2) => segments.push({ a, b });

  for (let y = -1; y <= height; y++) {
    for (let x = -1; x <= width; x++) {
      const a = at(x, y);
      const b = at(x + 1, y);
      const c = at(x + 1, y + 1);
      const d = at(x, y + 1);
      const code = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
      if (code === 0 || code === 15) continue;

      const pa = { x, y };
      const pb = { x: x + 1, y };
      const pc = { x: x + 1, y: y + 1 };
      const pd = { x, y: y + 1 };
      const T = () => interp(pa, a, pb, b); // top edge (a-b)
      const R = () => interp(pb, b, pc, c); // right edge (b-c)
      const B = () => interp(pc, c, pd, d); // bottom edge (c-d)
      const L = () => interp(pd, d, pa, a); // left edge (d-a)

      switch (code) {
        case 1:
        case 14:
          pushSeg(L(), T());
          break;
        case 2:
        case 13:
          pushSeg(T(), R());
          break;
        case 3:
        case 12:
          pushSeg(L(), R());
          break;
        case 4:
        case 11:
          pushSeg(R(), B());
          break;
        case 6:
        case 9:
          pushSeg(T(), B());
          break;
        case 7:
        case 8:
          pushSeg(L(), B());
          break;
        case 5: {
          // Saddle: tl & br water. Center decides the connection.
          const center = (a + b + c + d) / 4;
          if (center < 0) {
            pushSeg(T(), R());
            pushSeg(B(), L());
          } else {
            pushSeg(L(), T());
            pushSeg(R(), B());
          }
          break;
        }
        case 10: {
          // Saddle: tr & bl water.
          const center = (a + b + c + d) / 4;
          if (center < 0) {
            pushSeg(L(), T());
            pushSeg(R(), B());
          } else {
            pushSeg(T(), R());
            pushSeg(B(), L());
          }
          break;
        }
        default:
          break;
      }
    }
  }

  return stitch(segments);
}

/** Connect shared endpoints (each has degree 2) into closed loops. */
function stitch(segments: Segment[]): Vec2[][] {
  const byKey = new Map<string, number[]>();
  segments.forEach((seg, i) => {
    for (const k of [key(seg.a), key(seg.b)]) {
      const list = byKey.get(k);
      if (list) list.push(i);
      else byKey.set(k, [i]);
    }
  });

  const used = new Array<boolean>(segments.length).fill(false);
  const loops: Vec2[][] = [];

  for (let start = 0; start < segments.length; start++) {
    if (used[start]) continue;
    const loop: Vec2[] = [];
    let si = start;
    let curKey = key(segments[start].a);
    const startKey = curKey;
    // Walk segment-to-segment via shared points until we return to the start.
    for (let guard = 0; guard < segments.length + 1; guard++) {
      used[si] = true;
      const seg = segments[si];
      const aK = key(seg.a);
      const from = curKey === aK ? seg.a : seg.b;
      loop.push(from);
      const nextKey = curKey === aK ? key(seg.b) : aK;
      curKey = nextKey;
      if (curKey === startKey) break;
      const cand = byKey.get(curKey)?.find((j) => !used[j]);
      if (cand === undefined) break; // open contour (shouldn't happen with padding)
      si = cand;
    }
    if (loop.length >= 3) loops.push(loop);
  }

  return loops;
}

/** One Chaikin corner-cutting pass on a closed loop. */
function chaikinPass(loop: Vec2[]): Vec2[] {
  const n = loop.length;
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const p = loop[i];
    const q = loop[(i + 1) % n];
    out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
    out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
  }
  return out;
}

/** Smooth every loop with `iterations` Chaikin passes (rounds the diamond steps). */
export function smoothLoops(loops: Vec2[][], iterations = 2): Vec2[][] {
  return loops.map((loop) => {
    let out = loop;
    for (let i = 0; i < iterations; i++) out = chaikinPass(out);
    return out;
  });
}

/** Ray-cast point-in-polygon (loop in the same tile space). */
export function pointInLoop(p: Vec2, loop: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const a = loop[i];
    const b = loop[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** Signed area (shoelace); sign indicates winding. */
export function loopArea(loop: Vec2[]): number {
  let area = 0;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    area += (loop[j].x + loop[i].x) * (loop[j].y - loop[i].y);
  }
  return area / 2;
}
