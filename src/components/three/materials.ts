"use client";

import * as THREE from "three";

/** Phones, tablets and low-core devices get a lighter scene (smaller textures, no shadows or post effects). */
let low: boolean | undefined;
export function isLowEnd() {
  if (low !== undefined) return low;
  if (typeof window === "undefined") return false;
  low =
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency ?? 8) <= 4;
  return low;
}

/** Tiny deterministic PRNG so textures and shapes look the same on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------------- value noise (2D + 3D) ---------------- */
function hash(x: number, y: number, z: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144269504) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t: number) => t * t * (3 - 2 * t);
export function noise3(x: number, y: number, z: number, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, seed);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbm3(x: number, y: number, z: number, octaves = 5, seed = 0) {
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += a * noise3(x * f, y * f, z * f, seed + i * 17);
    norm += a;
    a *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}
/** Tileable-ish 2D fbm sampled on a torus so textures wrap around lathe geometry without a seam. */
function fbmWrap(u: number, v: number, scale: number, octaves: number, seed: number) {
  const a = u * Math.PI * 2;
  const r = scale / (Math.PI * 2);
  return fbm3(Math.cos(a) * r, Math.sin(a) * r, v * scale, octaves, seed);
}

/* ---------------- cooked-meat texture set ---------------- */
export type MeatLook = {
  base: string; // marinade colour
  deep: string; // darker cooked tone
  char: string; // burnt edges
  oil: string; // glossy highlight colour
  charAmount: number; // 0..1
  stripes?: boolean; // grill marks
  herbs?: number; // density of green flecks
  fibres?: number; // 0..1 strength of meat grain
};

type MeatMaps = { map: THREE.Texture; bumpMap: THREE.Texture; roughnessMap: THREE.Texture };
const cache = new Map<string, MeatMaps | THREE.Texture>();

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (e0: number, e1: number, x: number) => fade(clamp01((x - e0) / (e1 - e0)));

/**
 * Generates matching colour, bump and roughness maps from one height field:
 * charred peaks are dark and rough, marinade valleys are glossy with oil.
 */
export function meatMaps(key: string, look: MeatLook, seed = 1, size = 512): MeatMaps {
  if (isLowEnd()) size = Math.min(size, 128);
  const id = `meat:${key}:${size}`;
  const hit = cache.get(id);
  if (hit) return hit as MeatMaps;

  const mk = () => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    return c;
  };
  const cc = mk(), bc = mk(), rc = mk();
  const cg = cc.getContext("2d")!, bg = bc.getContext("2d")!, rg = rc.getContext("2d")!;
  const ci = cg.createImageData(size, size), bi = bg.createImageData(size, size), ri = rg.createImageData(size, size);

  const base = hex(look.base), deep = hex(look.deep), charC = hex(look.char), oil = hex(look.oil);
  const r = rng(seed);
  const herbs = look.herbs ?? 0;
  const fibres = look.fibres ?? 0.5;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = (y * size + x) * 4;
      const big = fbmWrap(u, v, 4, 4, seed);
      const mid = fbmWrap(u, v, 14, 4, seed + 5);
      const fine = fbmWrap(u, v, 60, 2, seed + 9);
      // stretched noise = muscle fibres running along the piece
      const fibre = fbm3(Math.cos(u * Math.PI * 2) * 30, Math.sin(u * Math.PI * 2) * 30, v * 4, 2, seed + 13);
      let height = big * 0.45 + mid * 0.35 + fine * 0.12 + fibre * 0.18 * fibres;

      // char: where the surface sticks out it touches the fire
      let charT = smooth(1 - look.charAmount * 0.55, 1.02 - look.charAmount * 0.3, big * 0.6 + mid * 0.5);
      if (look.stripes) {
        const s = Math.abs(Math.sin((v * 9 + big * 0.35) * Math.PI));
        const stripe = smooth(0.86, 0.97, s);
        charT = Math.max(charT, stripe * 0.95);
        height -= stripe * 0.08;
      }
      // tiny blistered black spots
      const blister = smooth(0.78, 0.86, fine) * smooth(0.45, 0.7, mid) * look.charAmount;
      charT = Math.max(charT, blister);

      let col = mix(base, deep, smooth(0.3, 0.75, mid));
      col = mix(col, charC, charT);
      // oily sheen in the valleys
      const oilT = smooth(0.55, 0.2, height) * (1 - charT) * 0.45;
      col = mix(col, oil, oilT);
      // spice grains
      if (r() < 0.012) col = mix(col, r() > 0.5 ? [60, 18, 6] : [140, 30, 10], 0.8);
      // coriander / methi flecks
      if (herbs && r() < herbs * 0.004) col = mix(col, [58, 110, 34], 0.85);

      ci.data[i] = col[0];
      ci.data[i + 1] = col[1];
      ci.data[i + 2] = col[2];
      ci.data[i + 3] = 255;
      const hb = clamp01(height + charT * 0.15) * 255;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = hb;
      bi.data[i + 3] = 255;
      const rough = clamp01(0.42 + charT * 0.5 - oilT * 0.5 + fine * 0.1) * 255;
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = rough;
      ri.data[i + 3] = 255;
    }
  }
  cg.putImageData(ci, 0, 0);
  bg.putImageData(bi, 0, 0);
  rg.putImageData(ri, 0, 0);

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = isLowEnd() ? 2 : 8;
    return t;
  };
  const maps = { map: tex(cc, true), bumpMap: tex(bc, false), roughnessMap: tex(rc, false) };
  cache.set(id, maps);
  return maps;
}

export function softDotTexture() {
  const id = "soft-dot";
  const hit = cache.get(id);
  if (hit) return hit as THREE.Texture;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  cache.set(id, tex);
  return tex;
}

/**
 * Push vertices along their normals with 3D fractal noise, so pieces look hand-cut and
 * unevenly cooked rather than CG-perfect. `lumps` adds a few big bulges (muscle groups).
 */
export function organic<T extends THREE.BufferGeometry>(geo: T, amp = 0.03, freq = 7, seed = 3, lumps = 0): T {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  geo.computeVertexNormals();
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const d = (fbm3(v.x * freq + seed, v.y * freq, v.z * freq, 4, seed) - 0.5) * 2;
    const lump = lumps ? (noise3(v.x * 2.2 + seed, v.y * 2.2, v.z * 2.2, seed + 3) - 0.5) * 2 * lumps : 0;
    v.addScaledVector(n, d * amp + lump);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Cooked looks, tuned against reference photos of tandoor-cooked meat. */
export const looks: Record<string, MeatLook> = {
  tandoori: { base: "#b5401c", deep: "#7e2210", char: "#1e0a05", oil: "#f08a3c", charAmount: 0.75, herbs: 0.6, fibres: 0.5 },
  seekh: { base: "#7a4422", deep: "#5a2e15", char: "#1a0b05", oil: "#c27a3e", charAmount: 0.6, herbs: 1.6, fibres: 0.15 },
  malai: { base: "#e3c08c", deep: "#c99a5e", char: "#4a2610", oil: "#fff0c8", charAmount: 0.5, stripes: true, herbs: 0.3, fibres: 0.4 },
  mutton: { base: "#7a3218", deep: "#55200e", char: "#160704", oil: "#c76a30", charAmount: 0.7, herbs: 0.5, fibres: 0.8 },
  fish: { base: "#e0a24a", deep: "#c47a2c", char: "#3a1a08", oil: "#ffd38a", charAmount: 0.45, stripes: true, herbs: 0.4, fibres: 0.3 },
};
