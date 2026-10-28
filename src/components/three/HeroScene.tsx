"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Environment, Float, Image, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Deg } from "./Deg";

// Real food photos orbit the deg as floating, glowing cards.
const slots = [
  { angle: 0.2, r: 3.5, y: 2.7 },
  { angle: 1.25, r: 3.3, y: 1.1 },
  { angle: 2.3, r: 3.6, y: 2.9 },
  { angle: 3.3, r: 3.4, y: 0.9 },
  { angle: 4.3, r: 3.5, y: 2.4 },
  { angle: 5.3, r: 3.6, y: 1.3 },
];
const CARD_W = 1.15;
const CARD_H = 0.85;

function PhotoCard({ url }: { url: string }) {
  return (
    <Billboard>
      <RoundedBox args={[CARD_W + 0.07, CARD_H + 0.07, 0.03]} radius={0.1} smoothness={4} position={[0, 0, -0.03]}>
        <meshStandardMaterial color="#2a160b" emissive="#ff7a2a" emissiveIntensity={0.55} metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <Image url={url} scale={[CARD_W, CARD_H]} radius={0.08} toneMapped={false} color="#ece4da" />
    </Billboard>
  );
}

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

function Orbiters({ progress, photos }: { progress: React.RefObject<number>; photos: string[] }) {
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
      {photos.slice(0, slots.length).map((url, i) => {
        const { angle, r, y } = slots[i];
        return (
          <group key={url} position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}>
            <Float speed={1.2 + i * 0.15} rotationIntensity={0.35} floatIntensity={1.2}>
              <Suspense fallback={null}>
                <PhotoCard url={url} />
              </Suspense>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export default function HeroScene({ photos }: { photos: string[] }) {
  const progress = useRef(0);
  const [active, setActive] = useState(true);
  useScrollProgress(progress, setActive);
  const [dpr, setDpr] = useState(1.5);
  const [fx, setFx] = useState(true);

  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [0, 2.6, 9], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => gl.setClearColor("#0b0807", 0)}
    >
      <PerformanceMonitor onDecline={() => { setDpr(1); setFx(false); }} onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))} />
      <fog attach="fog" args={["#0b0807", 9, 22]} />
      <ambientLight intensity={0.15} />
      <spotLight position={[4, 8, 5]} angle={0.45} penumbra={0.8} intensity={60} color="#ffd7a8" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 3, -4]} intensity={0.8} color="#6f86ff" />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} color="#ffb070" position={[0, 5, -6]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#ff6a2a" position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="ring" intensity={2} color="#ffe2c0" position={[5, 3, 3]} scale={3} />
          <Lightformer form="rect" intensity={0.6} color="#7f93ff" position={[6, 0, -2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>
        <group position={[0, -0.6, 0]}>
          <Deg openRef={progress} />
          <Orbiters progress={progress} photos={photos} />
          <ContactShadows position={[0, -0.3, 0]} opacity={0.7} scale={12} blur={2.6} far={4} color="#000" />
        </group>
      </Suspense>
      <Rig progress={progress} />
      {fx && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.1} intensity={0.9} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
