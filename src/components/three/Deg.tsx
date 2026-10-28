"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { organic, rng, softDotTexture } from "./materials";

const v2 = (x: number, y: number) => new THREE.Vector2(x, y);

/**
 * The hero object: a copper deg sealed with dough (dum pukht), sitting on live coals.
 * `openRef.current` (0..1) lifts the lid and breaks the seal; it is driven by scroll.
 */
export function Deg({ openRef }: { openRef: React.RefObject<number> }) {
  const lid = useRef<THREE.Group>(null);
  const seal = useRef<THREE.Mesh>(null);
  const insideGlow = useRef<THREE.PointLight>(null);

  const body = useMemo(() => {
    const profile = [
      v2(0, 0), v2(0.7, 0.02), v2(1.15, 0.18), v2(1.45, 0.5), v2(1.56, 0.85), v2(1.5, 1.18),
      v2(1.3, 1.45), v2(1.08, 1.6), v2(1.02, 1.68), v2(1.1, 1.73), v2(1.16, 1.78), v2(1.12, 1.82), v2(1.0, 1.8),
    ];
    return new THREE.LatheGeometry(profile, 96);
  }, []);

  const lidGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(v2(1.14 * Math.cos((t * Math.PI) / 2.3), 0.32 * Math.sin((t * Math.PI) / 2)));
    }
    pts.push(v2(0, 0.33));
    return new THREE.LatheGeometry(pts, 96);
  }, []);

  const sealGeo = useMemo(() => organic(new THREE.TorusGeometry(1.1, 0.08, 18, 120), 0.025, 9, 21), []);

  useFrame((state, dt) => {
    const o = openRef.current ?? 0;
    const t = state.clock.elapsedTime;
    if (lid.current) {
      const target = THREE.MathUtils.smoothstep(o, 0.05, 0.9);
      lid.current.position.y = THREE.MathUtils.damp(lid.current.position.y, 1.82 + target * 1.4, 6, dt);
      lid.current.position.x = THREE.MathUtils.damp(lid.current.position.x, target * 0.9, 6, dt);
      lid.current.rotation.z = THREE.MathUtils.damp(lid.current.rotation.z, -target * 0.75, 6, dt);
      // tiny rattle from the steam pressure while sealed
      lid.current.rotation.x = (1 - target) * Math.sin(t * 22) * 0.004;
    }
    if (seal.current) {
      const m = seal.current.material as THREE.MeshStandardMaterial;
      m.opacity = 1 - THREE.MathUtils.smoothstep(o, 0.02, 0.25);
      seal.current.visible = m.opacity > 0.01;
    }
    if (insideGlow.current) insideGlow.current.intensity = THREE.MathUtils.smoothstep(o, 0.1, 0.6) * 6;
  });

  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c47a45" metalness={1} roughness={0.27} clearcoat={0.4} clearcoatRoughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* hammered brass belt */}
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.56, 0.035, 12, 128]} />
        <meshStandardMaterial color="#e2b25c" metalness={1} roughness={0.2} />
      </mesh>
      {/* soot blackening near the base from years on the coals */}
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.12, 12, 96]} />
        <meshStandardMaterial color="#1a0f0a" roughness={0.9} transparent opacity={0.85} />
      </mesh>
      {/* food surface inside, visible once the lid lifts */}
      <mesh position={[0, 1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.04, 64]} />
        <meshStandardMaterial color="#d8902e" roughness={0.8} emissive="#5a2a08" emissiveIntensity={0.4} />
      </mesh>
      <pointLight ref={insideGlow} position={[0, 2.1, 0]} color="#ffb062" intensity={0} distance={4} />

      <mesh ref={seal} geometry={sealGeo} position={[0, 1.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#d9b483" roughness={0.95} transparent />
      </mesh>

      <group ref={lid} position={[0, 1.82, 0]}>
        <mesh geometry={lidGeo} castShadow>
          <meshPhysicalMaterial color="#b56d3b" metalness={1} roughness={0.3} clearcoat={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.13, 24, 16]} />
          <meshStandardMaterial color="#e2b25c" metalness={1} roughness={0.2} />
        </mesh>
        {/* traditional hot coals placed on the lid for even dum heat */}
        <Coals count={9} radius={0.6} y={0.3} small />
      </group>

      {/* handles */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.5, 1.35, 0]} rotation={[0, 0, s * 0.3]}>
          <torusGeometry args={[0.18, 0.04, 12, 32]} />
          <meshStandardMaterial color="#8a4f2a" metalness={1} roughness={0.35} />
        </mesh>
      ))}

      {/* iron chulha ring + coal bed */}
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[1.25, 0.06, 12, 64]} />
        <meshStandardMaterial color="#1b1b1b" metalness={0.8} roughness={0.6} />
      </mesh>
      <Coals count={70} radius={1.7} y={-0.2} />
      <FireLight />
      <Embers />
      <Steam openRef={openRef} />
    </group>
  );
}

function Coals({ count, radius, y, small = false }: { count: number; radius: number; y: number; small?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const geo = useMemo(() => organic(new THREE.DodecahedronGeometry(1, 0), 0.08, 3, 5), []);
  const seeds = useMemo(() => {
    const r = rng(count * 7 + (small ? 1 : 0));
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * radius;
      const s = (small ? 0.05 : 0.09) * (0.6 + r() * 0.8);
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: y + r() * 0.08, s, rot: r() * 6 };
    });
  }, [count, radius, y, small]);

  const ready = useRef(false);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    if (!ready.current) {
      const o = new THREE.Object3D();
      seeds.forEach((c, i) => {
        o.position.set(c.x, c.y, c.z);
        o.rotation.set(c.rot, c.rot * 2, c.rot * 0.5);
        o.scale.setScalar(c.s);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      ready.current = true;
    }
    if (mat.current) {
      const t = state.clock.elapsedTime;
      mat.current.emissiveIntensity = 0.75 + Math.sin(t * 3.1) * 0.2 + Math.sin(t * 7.3) * 0.12;
    }
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow>
      <meshStandardMaterial ref={mat} color="#0d0705" emissive="#e8380a" emissiveIntensity={0.75} roughness={0.95} />
    </instancedMesh>
  );
}

function FireLight() {
  const l = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (l.current) l.current.intensity = 22 + Math.sin(t * 9) * 4 + Math.sin(t * 23) * 2.5 + Math.sin(t * 3) * 3;
  });
  return <pointLight ref={l} position={[0, 0.15, 0]} color="#ff6a1f" distance={7} decay={2} intensity={22} />;
}

function Embers({ count = 140 }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const r = rng(42);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.6 + r() * 1.2;
      pos[i * 3] = Math.cos(a) * d;
      pos[i * 3 + 1] = r() * 4;
      pos[i * 3 + 2] = Math.sin(a) * d;
      speed[i] = 0.4 + r() * 0.9;
    }
    return { pos, speed };
  }, [count]);

  useFrame((s, dt) => {
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!p) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = p.getY(i) + data.speed[i] * dt;
      if (y > 4.5) y = 0;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 2 + i) * 0.003);
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial map={softDotTexture()} color="#ff8a3a" size={0.07} transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function Steam({ openRef, count = 26 }: { openRef: React.RefObject<number>; count?: number }) {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: count }, (_, i) => ({ offset: i / count, a: r() * Math.PI * 2, drift: 0.3 + r() * 0.6, size: 0.8 + r() * 0.9 }));
  }, [count]);
  const tex = useMemo(() => softDotTexture(), []);

  useFrame((s) => {
    const g = group.current;
    if (!g) return;
    const o = openRef.current ?? 0;
    const t = s.clock.elapsedTime * 0.18;
    g.children.forEach((child, i) => {
      const p = puffs[i];
      const life = (t + p.offset) % 1;
      const spr = child as THREE.Sprite;
      // sealed: thin wisps leak from the rim; open: a big plume rises from the centre
      const rimR = THREE.MathUtils.lerp(1.1, 0.4, o);
      spr.position.set(Math.cos(p.a) * rimR + Math.sin(life * 6 + i) * p.drift * life, 1.9 + life * (2.2 + o * 2), Math.sin(p.a) * rimR);
      const sc = p.size * (0.3 + life * (1.2 + o * 1.6));
      spr.scale.set(sc, sc, 1);
      (spr.material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * (0.07 + o * 0.16);
    });
  });

  return (
    <group ref={group}>
      {puffs.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={tex} color="#f7ead8" transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
