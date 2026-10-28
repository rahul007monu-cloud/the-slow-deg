"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import type { PieceKind } from "@/config/business";
import { charTexture, organic, palette, rng } from "./materials";

type MeatTone = keyof typeof palette;

function MeatMaterial({ tone, glaze = 0.5 }: { tone: MeatTone; glaze?: number }) {
  const p = palette[tone];
  const map = useMemo(() => charTexture(tone, p.base, p.burnt, p.glow, tone.length * 31), [tone, p]);
  // Clearcoat gives the buttery, freshly-basted shine
  return <meshPhysicalMaterial map={map} roughness={0.55} clearcoat={glaze} clearcoatRoughness={0.35} sheen={0.4} sheenColor="#ffb070" />;
}

function BoneMaterial() {
  return <meshPhysicalMaterial color="#efe2c4" roughness={0.45} clearcoat={0.2} />;
}

function SteelMaterial() {
  return <meshStandardMaterial color="#d6d6d6" metalness={1} roughness={0.22} />;
}

/** Teardrop lathe used for drumsticks and raan */
function useLegGeometry(length: number, bulb: number, seed: number) {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const shape = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.9);
      pts.push(new THREE.Vector2(0.07 + bulb * shape * (1 - 0.15 * t), t * length));
    }
    pts.push(new THREE.Vector2(0, length));
    const g = new THREE.LatheGeometry(pts, 48);
    return organic(g, 0.035, 6, seed);
  }, [length, bulb, seed]);
}

function BoneEnd({ length = 0.45, radius = 0.06 }) {
  return (
    <group position={[0, -length / 2, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius * 0.9, length, 16]} />
        <BoneMaterial />
      </mesh>
      <mesh position={[radius * 0.7, -length / 2, 0]} castShadow>
        <sphereGeometry args={[radius * 1.35, 16, 16]} />
        <BoneMaterial />
      </mesh>
      <mesh position={[-radius * 0.7, -length / 2, 0]} castShadow>
        <sphereGeometry args={[radius * 1.35, 16, 16]} />
        <BoneMaterial />
      </mesh>
    </group>
  );
}

export function Drumstick() {
  const geo = useLegGeometry(1.1, 0.34, 4);
  return (
    <group position={[0, -0.25, 0]}>
      <mesh geometry={geo} castShadow>
        <MeatMaterial tone="tandoori" glaze={0.7} />
      </mesh>
      <BoneEnd />
      <Garnish count={7} radius={0.3} y={0.75} seed={2} />
    </group>
  );
}

export function Raan() {
  const geo = useLegGeometry(1.6, 0.52, 9);
  return (
    <group position={[0, -0.4, 0]} rotation={[0, 0, 0.15]}>
      <mesh geometry={geo} castShadow>
        <MeatMaterial tone="mutton" glaze={0.9} />
      </mesh>
      <BoneEnd length={0.55} radius={0.085} />
      <Garnish count={14} radius={0.45} y={1} seed={5} />
    </group>
  );
}

export function SeekhKebab() {
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.14, 1.5, 12, 28, 80);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // the finger-pressed ridges you see on real seekh
      const ridge = 1 + 0.13 * Math.sin(v.y * 26) + 0.05 * Math.sin(v.y * 7 + Math.atan2(v.z, v.x) * 3);
      pos.setXYZ(i, v.x * ridge, v.y, v.z * ridge);
    }
    g.computeVertexNormals();
    return organic(g, 0.012, 14, 7);
  }, []);
  return (
    <group rotation={[0, 0, Math.PI / 2.4]}>
      <mesh geometry={geo} castShadow>
        <MeatMaterial tone="seekh" glaze={0.45} />
      </mesh>
      <Skewer length={2.3} />
      <Garnish count={10} radius={0.17} y={0} spread={1.4} seed={8} green />
    </group>
  );
}

function Skewer({ length }: { length: number }) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.018, 0.018, length, 8]} />
        <SteelMaterial />
      </mesh>
      <mesh position={[0, length / 2 + 0.06, 0]}>
        <torusGeometry args={[0.07, 0.015, 8, 24]} />
        <SteelMaterial />
      </mesh>
    </group>
  );
}

function SkewerChunks({ tone, chunk, count }: { tone: MeatTone; chunk: number; count: number }) {
  const items = useMemo(() => {
    const r = rng(tone.length * 13);
    return Array.from({ length: count * 2 - 1 }, (_, i) => ({
      meat: i % 2 === 0,
      y: (i - (count * 2 - 2) / 2) * (chunk * 0.72),
      rot: [r() * 0.6, r() * Math.PI, r() * 0.6] as [number, number, number],
      veg: r() > 0.5 ? "#3f7d2a" : r() > 0.5 ? "#c0392b" : "#e9d7df",
    }));
  }, [tone, chunk, count]);
  return (
    <group>
      {items.map((it, i) =>
        it.meat ? (
          <RoundedBox key={i} args={[chunk, chunk * 0.9, chunk]} radius={chunk * 0.22} smoothness={4} position={[0, it.y, 0]} rotation={it.rot} castShadow>
            <MeatMaterial tone={tone} glaze={0.6} />
          </RoundedBox>
        ) : (
          <mesh key={i} position={[0, it.y, 0]} rotation={it.rot} castShadow>
            <boxGeometry args={[chunk * 0.95, chunk * 0.12, chunk * 0.8]} />
            <meshPhysicalMaterial color={it.veg} roughness={0.35} clearcoat={0.6} transmission={it.veg === "#e9d7df" ? 0.3 : 0} />
          </mesh>
        ),
      )}
    </group>
  );
}

export function TikkaSkewer() {
  return (
    <group rotation={[0, 0, -Math.PI / 2.6]}>
      <SkewerChunks tone="malai" chunk={0.32} count={4} />
      <Skewer length={2.1} />
    </group>
  );
}

export function FishTikka() {
  return (
    <group rotation={[0, 0, Math.PI / 2.2]}>
      <SkewerChunks tone="fish" chunk={0.36} count={3} />
      <Skewer length={1.9} />
      {/* lemon wedge */}
      <mesh position={[0.35, -0.75, 0.1]} rotation={[0.4, 0, 1]} castShadow>
        <sphereGeometry args={[0.16, 24, 16, 0, Math.PI]} />
        <meshPhysicalMaterial color="#f2d544" roughness={0.3} clearcoat={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function LambChop() {
  const meat = useMemo(() => {
    const g = new THREE.SphereGeometry(0.45, 48, 32);
    g.scale(1, 0.32, 0.8);
    return organic(g, 0.04, 5, 11);
  }, []);
  const fat = useMemo(() => {
    const g = new THREE.TorusGeometry(0.42, 0.07, 16, 48, Math.PI * 1.2);
    g.scale(1, 1, 0.8);
    return organic(g, 0.02, 9, 12);
  }, []);
  return (
    <group rotation={[0.5, 0, 0.4]}>
      <mesh geometry={meat} castShadow>
        <MeatMaterial tone="mutton" glaze={0.8} />
      </mesh>
      <mesh geometry={fat} rotation={[Math.PI / 2, 0, Math.PI * 0.9]} position={[0, 0.02, 0]}>
        <meshPhysicalMaterial color="#e8b47a" roughness={0.4} clearcoat={0.9} />
      </mesh>
      <mesh position={[0.75, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.7, 14]} />
        <BoneMaterial />
      </mesh>
      <mesh position={[1.1, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <BoneMaterial />
      </mesh>
      <Garnish count={8} radius={0.3} y={0.15} seed={13} flat />
    </group>
  );
}

/** Coriander leaves / onion rings / chilli flakes sprinkled on top */
function Garnish({ count, radius, y, seed, spread = 0, green = false, flat = false }: { count: number; radius: number; y: number; seed: number; spread?: number; green?: boolean; flat?: boolean }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const yy = spread ? (r() - 0.5) * spread : y + (r() - 0.5) * 0.3;
      const rr = radius * (flat ? r() : 1);
      return {
        p: [Math.cos(a) * rr, flat ? y : yy, Math.sin(a) * rr] as [number, number, number],
        rot: [r() * 3, r() * 3, r() * 3] as [number, number, number],
        color: green || r() > 0.4 ? "#3e8f2c" : "#d9ccd8",
      };
    });
  }, [count, radius, y, seed, spread, green, flat]);
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.p} rotation={it.rot}>
          <circleGeometry args={[0.045, 6]} />
          <meshStandardMaterial color={it.color} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
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
  }
}
