import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei'; // Center dihapus
import * as THREE from 'three';

// Pastikan menerima prop 'position' agar bisa diturunkan sejajar lantai
export function Avatar({ audioUrl, isPlaying, position }) {
  const { scene, animations } = useGLTF('/idle_Theresa.glb');
  const { actions } = useAnimations(animations, scene);
  
  const groupRef = useRef();

  // Reference untuk tulang leher dan kepala (Head Tracking)
  const headBone = useRef();
  const neckBone = useRef();
  
  const [audioElement] = useState(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; 
    return audio;
  });

  // 1. --- PEMUTARAN ANIMASI (Hanya dipanggil sekali) ---
  useEffect(() => {
    if (actions) {
      const animNames = Object.keys(actions);
      if (animNames.length > 0) {
        actions[animNames[0]].reset().fadeIn(0.5).play();
      }
    }
  }, [actions]);

  // 2. --- TRAVERSAL: PERBAIKAN MATERIAL & PENCARIAN TULANG ---
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;    
          child.receiveShadow = true; 

          if (child.material) {
            const fixMaterial = (mat) => {
              mat.side = THREE.DoubleSide; 
              mat.transparent = false; 
              mat.depthWrite = true;
              mat.alphaTest = 0.5; 
              mat.needsUpdate = true;
            };

            if (Array.isArray(child.material)) {
              child.material.forEach(fixMaterial);
            } else {
              fixMaterial(child.material);
            }
          }
        }

        if (child.isBone) {
          const boneName = child.name.toLowerCase();
          if (boneName.includes('head')) {
            headBone.current = child;
          } else if (boneName.includes('neck')) {
            neckBone.current = child;
          }
        }
      });
    }
  }, [scene]);

  // 3. --- PEMUTARAN AUDIO (Lebih Sederhana Tanpa Lip-Sync) ---
  useEffect(() => {
    if (isPlaying && audioUrl) {
      audioElement.src = audioUrl;
      audioElement.play().catch(e => console.error("Gagal putar audio:", e));
    } else {
      audioElement.pause();
    }

    return () => {
      audioElement.pause();
    };
  }, [isPlaying, audioUrl, audioElement]);

  // 4. --- RENDER LOOP: HANYA HEAD TRACKING ---
  useFrame((state) => {
    
    // HEAD TRACKING: Kepala mengikuti mouse
    if (headBone.current && neckBone.current) {
      const maxRotationY = Math.PI * 0.25; 
      const maxRotationX = Math.PI * 0.15; 
      const headScreenOffsetY = 0.5; 

      const targetRotationY = state.mouse.x * maxRotationY;
      const targetRotationX = -(state.mouse.y - headScreenOffsetY) * maxRotationX; 

      headBone.current.rotation.y = THREE.MathUtils.lerp(headBone.current.rotation.y, targetRotationY, 0.1);
      headBone.current.rotation.x = THREE.MathUtils.lerp(headBone.current.rotation.x, targetRotationX, 0.1);
      
      neckBone.current.rotation.y = THREE.MathUtils.lerp(neckBone.current.rotation.y, targetRotationY * 0.5, 0.1);
    }
  });

  return (
    // Gunakan <group position={position}> BUKAN <Center>
    <group position={position}>
      <primitive ref={groupRef} object={scene} castShadow receiveShadow />
    </group>
  );
}