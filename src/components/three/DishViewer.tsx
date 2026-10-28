"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import type { PieceKind } from "@/lib/types";
import { Piece } from "./MeatPieces";

function Turntable({ kind }: { kind: PieceKind }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    // pop-in when the dish changes
    const s = THREE.MathUtils.damp(g.current.scale.x, 1, 7, dt);
    g.current.scale.setScalar(s);
  });
  return (
    <group ref={g} key={kind} scale={0.2}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <group position={[0, 0.9, 0]} scale={kind === "raan" ? 0.7 : kind === "drumstick" ? 0.95 : 1.1}>
          <Piece kind={kind} />
        </group>
      </Float>
    </group>
  );
}

export default function DishViewer({ kind }: { kind: PieceKind }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 1.7, 4.8], fov: 35 }} gl={{ antialias: true }}>
      <ambientLight intensity={0.2} />
      <spotLight position={[3, 6, 3]} angle={0.5} penumbra={1} intensity={45} color="#ffdcb0" castShadow />
      <pointLight position={[0, 0.1, 0]} intensity={6} color="#ff5a1f" distance={3} />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={3} color="#ffb070" position={[0, 4, -4]} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={2} color="#ffe2c0" position={[4, 2, 3]} scale={2} />
        </Environment>
        <Turntable kind={kind} />
        {/* slate serving board */}
        <RoundedBox args={[3, 0.12, 1.6]} radius={0.05} position={[0, 0, 0]} receiveShadow>
          <meshStandardMaterial color="#1d1a19" roughness={0.9} />
        </RoundedBox>
        <ContactShadows position={[0, 0.07, 0]} opacity={0.6} scale={4} blur={2.4} far={2} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.6} minPolarAngle={0.6} maxPolarAngle={1.45} target={[0, 0.8, 0]} />
    </Canvas>
  );
}
