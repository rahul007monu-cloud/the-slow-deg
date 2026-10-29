"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Deg } from "./Deg";
import { isLowEnd } from "./materials";
import { Drumstick, FishTikka, LambChop, Raan, SeekhKebab, TikkaSkewer } from "./MeatPieces";

const orbit = [
  { C: SeekhKebab, angle: 0.2, r: 3.4, y: 2.6, s: 0.85 },
  { C: Drumstick, angle: 1.25, r: 3.2, y: 1.2, s: 0.9 },
  { C: TikkaSkewer, angle: 2.3, r: 3.5, y: 2.9, s: 0.8 },
  { C: LambChop, angle: 3.3, r: 3.3, y: 0.9, s: 0.9 },
  { C: FishTikka, angle: 4.3, r: 3.4, y: 2.4, s: 0.8 },
  { C: Raan, angle: 5.3, r: 3.6, y: 1.4, s: 0.7 },
];

/** Reads the page scroll (works with Lenis, which drives native scroll) and maps it to 0..1 over the hero. */
function useScrollProgress(ref: React.RefObject<number>, setActive: (v: boolean) => void) {
  useEffect(() => {
    const onScroll = () => {
      ref.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.2)));
      // stop rendering once the hero has scrolled out of view to save battery
      setActive(window.scrollY < window.innerHeight * 2.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, setActive]);
}

function Rig({ progress }: { progress: React.RefObject<number> }) {
  const { camera, pointer, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.3, 0));
  const narrow = size.width < 768;
  useFrame((_, dt) => {
    const p = progress.current ?? 0;
    const dist = (narrow ? 11 : 8) - p * 2.2;
    const tx = pointer.x * 0.9 + (narrow ? 0 : -1.6 * (1 - p));
    const ty = 2.4 + pointer.y * 0.5 + p * 1.6;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, dist, 3, dt);
    look.current.set(narrow ? 0 : -1.4 * (1 - p), 1.3 + p * 0.6, 0);
    camera.lookAt(look.current);
  });
  return null;
}

function Orbiters({ progress }: { progress: React.RefObject<number> }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    const p = progress.current ?? 0;
    g.current.rotation.y += dt * (0.12 + p * 0.25);
    const sc = THREE.MathUtils.damp(g.current.scale.x, 1 + p * 0.25, 4, dt);
    g.current.scale.setScalar(sc);
  });
  return (
    <group ref={g} position={[0.6, 0, -0.6]}>
      {orbit.map(({ C, angle, r, y, s }, i) => (
        <group key={i} position={[Math.cos(angle) * r, y, Math.sin(angle) * r]} scale={s}>
          <Float speed={1.4 + i * 0.15} rotationIntensity={1.2} floatIntensity={1.4}>
            <C />
          </Float>
        </group>
      ))}
    </group>
  );
}

export default function HeroScene() {
  const progress = useRef(0);
  const [active, setActive] = useState(true);
  useScrollProgress(progress, setActive);
  const [low] = useState(isLowEnd);
  const [dpr, setDpr] = useState(low ? 1 : 1.5);
  const [fx, setFx] = useState(!low);

  return (
    <Canvas
      shadows={!low}
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [0, 2.6, 9], fov: 38 }}
      gl={{ antialias: !low, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => gl.setClearColor("#0b0807", 0)}
    >
      <PerformanceMonitor onDecline={() => { setDpr(1); setFx(false); }} onIncline={() => setDpr(Math.min(low ? 1.5 : 2, window.devicePixelRatio))} />
      <fog attach="fog" args={["#0b0807", 9, 22]} />
      <ambientLight intensity={0.15} />
      <spotLight position={[4, 8, 5]} angle={0.45} penumbra={0.8} intensity={60} color="#ffd7a8" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 3, -4]} intensity={0.8} color="#6f86ff" />
      <Suspense fallback={null}>
        <Environment resolution={low ? 64 : 256}>
          <Lightformer form="rect" intensity={3} color="#ffb070" position={[0, 5, -6]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#ff6a2a" position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="ring" intensity={2} color="#ffe2c0" position={[5, 3, 3]} scale={3} />
          <Lightformer form="rect" intensity={0.6} color="#7f93ff" position={[6, 0, -2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>
        <group position={[0, -0.6, 0]}>
          <Deg openRef={progress} low={low} />
          <Orbiters progress={progress} />
          <ContactShadows position={[0, -0.3, 0]} opacity={0.7} scale={12} blur={2.6} far={4} color="#000" frames={low ? 1 : Infinity} resolution={low ? 256 : 512} />
        </group>
      </Suspense>
      <Rig progress={progress} />
      {fx && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.75} intensity={0.9} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
