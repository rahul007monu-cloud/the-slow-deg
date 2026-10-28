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
