"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { PieceKind } from "@/lib/types";
import { fbm3, isLowEnd, looks, meatMaps, organic, rng } from "./materials";

type Tone = keyof typeof looks;

/* ----------------------------- materials ----------------------------- */

function MeatMaterial({ tone, glaze = 0.6, repeat = [1, 1] }: { tone: Tone; glaze?: number; repeat?: [number, number] }) {
  const [rx, ry] = repeat;
  const maps = useMemo(() => {
    const m = meatMaps(tone, looks[tone], tone.length * 31 + 7, 256);
    if (rx === 1 && ry === 1) return m;
    // clones share the pixels but keep their own tiling
    const c = (t: THREE.Texture) => {
      const k = t.clone();
      k.repeat.set(rx, ry);
      k.needsUpdate = true;
      return k;
    };
    return { map: c(m.map), bumpMap: c(m.bumpMap), roughnessMap: c(m.roughnessMap) };
  }, [tone, rx, ry]);
  if (isLowEnd())
    return <meshStandardMaterial map={maps.map} bumpMap={maps.bumpMap} bumpScale={3} roughnessMap={maps.roughnessMap} roughness={0.85} />;
  return (
    <meshPhysicalMaterial
      map={maps.map}
      bumpMap={maps.bumpMap}
      bumpScale={3}
      roughnessMap={maps.roughnessMap}
      roughness={1}
      clearcoat={glaze} // basted butter / oil
      clearcoatRoughness={0.28}
      sheen={0.35}
      sheenRoughness={0.6}
      sheenColor="#ff9a55" // fakes light scattering through the marinade
    />
  );
}

function BoneMaterial() {
  if (isLowEnd()) return <meshStandardMaterial color="#e9dcc0" roughness={0.5} />;
  return <meshPhysicalMaterial color="#e9dcc0" roughness={0.5} clearcoat={0.15} sheen={0.3} sheenColor="#fff2d8" />;
}
function SteelMaterial() {
  return <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.28} />;
}

/* ----------------------------- shapes ----------------------------- */

/**
 * Chicken leg / goat leg: an asymmetric teardrop with knife slashes (as in real tandoori),
 * lumpy muscle and a slight bend.
 */
function useLegGeometry(length: number, bulb: number, seed: number, slashes: number) {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const shape = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.85);
      pts.push(new THREE.Vector2(0.065 + bulb * shape * (1 - 0.12 * t), t * length));
    }
    pts.push(new THREE.Vector2(0, length));
    const g = new THREE.LatheGeometry(pts, 72);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = v.y / length;
      // flatten one side and bend the tip, like a real leg
      v.z *= 0.82;
      v.x += Math.pow(t, 2) * 0.12 * length;
      // knife slashes across the front of the thick part
      if (slashes && v.z > 0 && t > 0.3 && t < 0.9) {
        const ang = Math.atan2(v.x, v.z);
        for (let k = 0; k < slashes; k++) {
          const centre = 0.42 + k * (0.42 / slashes);
          const d = Math.abs(t - centre - ang * 0.05);
          if (d < 0.018) {
            const depth = (1 - d / 0.018) * 0.055 * Math.cos(ang);
            const r = Math.hypot(v.x, v.z);
            const s = Math.max(0.2, (r - depth) / r);
            v.x *= s;
            v.z *= s;
          }
        }
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    return organic(g, 0.03, 4.5, seed, 0.035);
  }, [length, bulb, seed, slashes]);
}

/** A rough, hand-cut chunk (tikka, fish) built from a subdivided rounded cube. */
function chunkGeometry(size: number, seed: number) {
  const g = new THREE.BoxGeometry(size, size * 0.85, size, 8, 8, 8);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const r = rng(seed);
  const sx = 0.85 + r() * 0.3, sz = 0.85 + r() * 0.3;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    const sph = v.clone().normalize().multiplyScalar(size * 0.6);
    v.lerp(sph, 0.45); // rounded but not a ball
    v.x *= sx;
    v.z *= sz;
    void len;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return organic(g, size * 0.09, 6 / size, seed, size * 0.06);
}

/* ----------------------------- garnish ----------------------------- */

let leafGeo: THREE.BufferGeometry | null = null;
function coriander() {
  if (leafGeo) return leafGeo;
  // three-lobed coriander leaf
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.05, 0.02, -0.07, 0.06, -0.04, 0.08);
  s.bezierCurveTo(-0.05, 0.11, -0.02, 0.13, 0, 0.11);
  s.bezierCurveTo(0.02, 0.13, 0.05, 0.11, 0.04, 0.08);
  s.bezierCurveTo(0.07, 0.06, 0.05, 0.02, 0, 0);
  const g = new THREE.ShapeGeometry(s, 6);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.pow(pos.getX(i) * 8, 2) * 0.02); // slight curl
  g.computeVertexNormals();
  leafGeo = g;
  return g;
}

function Garnish({ count, radius, y, seed, spread = 0, flat = false, onion = 0 }: { count: number; radius: number; y: number; seed: number; spread?: number; flat?: boolean; onion?: number }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const yy = spread ? (r() - 0.5) * spread : y + (r() - 0.5) * 0.25;
      const rr = radius * (flat ? 0.3 + r() * 0.7 : 1.02);
      return {
        p: [Math.cos(a) * rr, yy, Math.sin(a) * rr] as [number, number, number],
        rot: [r() * 3, a + Math.PI / 2, r() * 3] as [number, number, number],
        s: 0.8 + r() * 0.6,
        tone: r() > 0.5 ? "#3f8a2a" : "#2f6e20",
      };
    });
  }, [count, radius, y, seed, spread, flat]);
  const leaf = useMemo(() => coriander(), []);
  const rings = useMemo(() => {
    const r = rng(seed + 99);
    return Array.from({ length: onion }, () => ({ p: [(r() - 0.5) * radius * 2, y + (r() - 0.5) * 0.3, (r() - 0.5) * radius] as [number, number, number], rot: [r() * 3, r() * 3, r() * 3] as [number, number, number], s: 0.7 + r() * 0.5 }));
  }, [onion, radius, y, seed]);
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} geometry={leaf} position={it.p} rotation={it.rot} scale={it.s}>
          <meshPhysicalMaterial color={it.tone} roughness={0.45} clearcoat={0.4} side={THREE.DoubleSide} sheen={0.5} sheenColor="#a8e07a" />
        </mesh>
      ))}
      {rings.map((it, i) => (
        <mesh key={`o${i}`} position={it.p} rotation={it.rot} scale={it.s}>
          <torusGeometry args={[0.09, 0.012, 8, 28]} />
          <meshPhysicalMaterial color="#e9c6d6" roughness={0.3} transmission={0.35} thickness={0.05} clearcoat={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function LemonWedge(props: React.ComponentProps<"group">) {
  return (
    <group {...props}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 24, 16, 0, Math.PI * 0.6, 0, Math.PI]} />
        <meshPhysicalMaterial color="#e6c52c" roughness={0.45} clearcoat={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* juicy flesh faces */}
      <mesh rotation={[0, 0, 0]}>
        <circleGeometry args={[0.145, 24, -Math.PI / 2, Math.PI]} />
        <meshPhysicalMaterial color="#f6ea8a" roughness={0.2} transmission={0.4} thickness={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BoneEnd({ length = 0.45, radius = 0.06 }) {
  const shaft = useMemo(() => organic(new THREE.CylinderGeometry(radius, radius * 0.85, length, 20, 8), radius * 0.12, 18, 4), [length, radius]);
  const knob = useMemo(() => organic(new THREE.SphereGeometry(radius * 1.45, 20, 16), radius * 0.2, 14, 6), [radius]);
  return (
    <group position={[0, -length / 2 + 0.02, 0]}>
      <mesh geometry={shaft} castShadow>
        <BoneMaterial />
      </mesh>
      <mesh geometry={knob} position={[radius * 0.5, -length / 2, 0]} scale={[1.2, 0.8, 0.9]} castShadow>
        <BoneMaterial />
      </mesh>
      <mesh geometry={knob} position={[-radius * 0.6, -length / 2 + 0.02, 0]} scale={[0.9, 0.75, 0.85]} castShadow>
        <BoneMaterial />
      </mesh>
      {/* browned meat edge where it was trimmed off the bone */}
      <mesh position={[0, length / 2 - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.15, radius * 0.45, 10, 24]} />
        <MeatMaterial tone="tandoori" glaze={0.4} />
      </mesh>
    </group>
  );
}

function Skewer({ length }: { length: number }) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.016, 0.016, length, 8]} />
        <SteelMaterial />
      </mesh>
      {/* soot near the meat */}
      <mesh>
        <cylinderGeometry args={[0.0175, 0.0175, length * 0.7, 8]} />
        <meshStandardMaterial color="#2a2522" metalness={0.6} roughness={0.7} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, length / 2 + 0.06, 0]}>
        <torusGeometry args={[0.07, 0.014, 8, 24]} />
        <SteelMaterial />
      </mesh>
    </group>
  );
}

/* ----------------------------- pieces ----------------------------- */

export function Drumstick() {
  const geo = useLegGeometry(1.1, 0.34, 4, 3);
  return (
    <group position={[0, -0.25, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <MeatMaterial tone="tandoori" glaze={0.75} repeat={[2, 1]} />
      </mesh>
      <BoneEnd />
      <Garnish count={9} radius={0.29} y={0.7} seed={2} />
    </group>
  );
}

export function Raan() {
  const geo = useLegGeometry(1.6, 0.5, 9, 4);
  return (
    <group position={[0, -0.45, 0]} rotation={[0, 0, 0.15]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <MeatMaterial tone="mutton" glaze={0.95} repeat={[2, 1]} />
      </mesh>
      <BoneEnd length={0.6} radius={0.085} />
      <Garnish count={16} radius={0.44} y={1} seed={5} onion={5} />
    </group>
  );
}

export function SeekhKebab() {
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.14, 1.5, 12, 32, 96);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // finger-pressed ridges and uneven thickness of hand-shaped mince
      const ridge = 1 + 0.11 * Math.sin(v.y * 24 + fbm3(v.x * 4, v.y * 3, v.z * 4, 2, 2) * 3) + 0.08 * (fbm3(v.x * 3, v.y * 1.5, v.z * 3, 3, 4) - 0.5);
      const bend = Math.sin(v.y * 1.4) * 0.05;
      pos.setXYZ(i, v.x * ridge + bend, v.y, v.z * ridge);
    }
    g.computeVertexNormals();
    return organic(g, 0.014, 16, 7);
  }, []);
  return (
    <group rotation={[0, 0, Math.PI / 2.4]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <MeatMaterial tone="seekh" glaze={0.5} repeat={[1, 3]} />
      </mesh>
      <Skewer length={2.3} />
      <Garnish count={8} radius={0.16} y={0} spread={1.3} seed={8} onion={3} />
    </group>
  );
}

function SkewerChunks({ tone, chunk, count, seed }: { tone: Tone; chunk: number; count: number; seed: number }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count * 2 - 1 }, (_, i) => ({
      meat: i % 2 === 0,
      y: (i - (count * 2 - 2) / 2) * (chunk * 0.78),
      geo: i % 2 === 0 ? chunkGeometry(chunk, seed + i) : null,
      rot: [r() * 0.8, r() * Math.PI, r() * 0.8] as [number, number, number],
      veg: r() > 0.55 ? "onion" : r() > 0.5 ? "green" : "red",
    }));
  }, [chunk, count, seed]);
  return (
    <group>
      {items.map((it, i) =>
        it.meat ? (
          <mesh key={i} geometry={it.geo!} position={[0, it.y, 0]} rotation={it.rot} castShadow receiveShadow>
            <MeatMaterial tone={tone} glaze={0.65} />
          </mesh>
        ) : it.veg === "onion" ? (
          <group key={i} position={[0, it.y, 0]} rotation={it.rot}>
            {[0, 1, 2].map((k) => (
              <mesh key={k}>
                <cylinderGeometry args={[chunk * (0.5 - k * 0.1), chunk * (0.5 - k * 0.1), chunk * 0.12, 24, 1, true, 0, Math.PI * 0.7]} />
                <meshPhysicalMaterial color={k ? "#f1e3ea" : "#c98aa8"} roughness={0.3} transmission={0.3} thickness={0.04} clearcoat={0.7} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh key={i} position={[0, it.y, 0]} rotation={it.rot} castShadow>
            <cylinderGeometry args={[chunk * 0.55, chunk * 0.55, chunk * 0.1, 24, 1, true, 0, Math.PI * 0.55]} />
            <meshPhysicalMaterial color={it.veg === "green" ? "#3b7a23" : "#b8261b"} roughness={0.25} clearcoat={1} side={THREE.DoubleSide} />
          </mesh>
        ),
      )}
    </group>
  );
}

export function TikkaSkewer() {
  return (
    <group rotation={[0, 0, -Math.PI / 2.6]}>
      <SkewerChunks tone="malai" chunk={0.34} count={4} seed={21} />
      <Skewer length={2.1} />
      <Garnish count={6} radius={0.2} y={0} spread={1.1} seed={22} />
    </group>
  );
}

export function FishTikka() {
  return (
    <group rotation={[0, 0, Math.PI / 2.2]}>
      <SkewerChunks tone="fish" chunk={0.38} count={3} seed={31} />
      <Skewer length={1.9} />
      <LemonWedge position={[0.38, -0.75, 0.1]} rotation={[0.4, 0, 1]} />
    </group>
  );
}

export function LambChop() {
  const meat = useMemo(() => {
    const g = new THREE.SphereGeometry(0.45, 64, 40);
    g.scale(1, 0.34, 0.8);
    return organic(g, 0.035, 4, 11, 0.03);
  }, []);
  const fat = useMemo(() => {
    const g = new THREE.TorusGeometry(0.42, 0.075, 20, 64, Math.PI * 1.25);
    g.scale(1, 1, 0.8);
    return organic(g, 0.018, 9, 12);
  }, []);
  const bone = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0.7, 0.04, 0.02), new THREE.Vector3(1.05, 0.1, 0)]);
    return organic(new THREE.TubeGeometry(curve, 24, 0.045, 12), 0.006, 20, 3);
  }, []);
  return (
    <group rotation={[0.5, 0, 0.4]}>
      <mesh geometry={meat} castShadow receiveShadow>
        <MeatMaterial tone="mutton" glaze={0.85} />
      </mesh>
      <mesh geometry={fat} rotation={[Math.PI / 2, 0, Math.PI * 0.88]} position={[0, 0.02, 0]}>
        <meshPhysicalMaterial color="#e2a868" roughness={0.35} clearcoat={0.9} sheen={0.6} sheenColor="#ffd9a0" />
      </mesh>
      <mesh geometry={bone} castShadow>
        <BoneMaterial />
      </mesh>
      <mesh position={[1.07, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <BoneMaterial />
      </mesh>
      <Garnish count={10} radius={0.32} y={0.16} seed={13} flat />
    </group>
  );
}

export function Piece({ kind }: { kind: PieceKind }) {
  switch (kind) {
    case "drumstick":
      return <Drumstick />;
    case "raan":
      return <Raan />;
    case "seekh":
      return <SeekhKebab />;
    case "tikka":
      return <TikkaSkewer />;
    case "fish":
      return <FishTikka />;
    case "chop":
      return <LambChop />;
    default:
      return null;
  }
}
