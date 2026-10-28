"use client";

import * as THREE from "three";

/** Tiny deterministic PRNG so textures and shapes look the same on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cache = new Map<string, THREE.Texture>();

/**
 * Procedural "tandoor char" texture: base colour, darker burnt patches,
 * golden highlights and spice specks. No image files needed.
 */
export function charTexture(key: string, base: string, burnt: string, glow: string, seed = 1) {
  const id = `char:${key}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const blot = (color: string, count: number, min: number, max: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const x = r() * size;
      const y = r() * size;
      const rad = min + r() * (max - min);
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, color);
      grd.addColorStop(1, "transparent");
      g.globalAlpha = alpha * (0.5 + r() * 0.5);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
  };
  blot(glow, 30, 10, 40, 0.5);
  blot(burnt, 55, 4, 26, 0.75);
  blot("#120804", 40, 2, 8, 0.8);
  // spice specks
  g.globalAlpha = 0.9;
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() > 0.5 ? "#3b1206" : r() > 0.5 ? "#7a2a0c" : "#2a3a12";
    g.fillRect(r() * size, r() * size, 1 + r() * 1.6, 1 + r() * 1.6);
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  cache.set(id, tex);
  return tex;
}

export function softDotTexture() {
  const id = "soft-dot";
  const hit = cache.get(id);
  if (hit) return hit;
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

/** Push vertices along their normals with layered sine noise so food looks hand-made, not CG-perfect. */
export function organic<T extends THREE.BufferGeometry>(geo: T, amp = 0.03, freq = 7, seed = 3): T {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  geo.computeVertexNormals();
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const o = seed * 1.7;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const d =
      Math.sin(v.x * freq + o) * Math.cos(v.y * freq * 1.3 + o) * 0.6 +
      Math.sin(v.z * freq * 2.1 + v.x * 3 + o) * 0.3 +
      Math.sin((v.x + v.y + v.z) * freq * 3.7) * 0.1;
    v.addScaledVector(n, d * amp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export const palette = {
  tandoori: { base: "#a8431c", burnt: "#3a1307", glow: "#e0782c" },
  seekh: { base: "#6e3518", burnt: "#24100a", glow: "#a65a2a" },
  malai: { base: "#e2bf8c", burnt: "#6b3c18", glow: "#f6dcae" },
  mutton: { base: "#7a2f17", burnt: "#2a0d05", glow: "#b35a2b" },
  fish: { base: "#d68b33", burnt: "#5a2a0c", glow: "#f2b85f" },
};
