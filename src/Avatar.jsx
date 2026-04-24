import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Center } from '@react-three/drei';
import * as THREE from 'three'; // WAJIB TAMBAHKAN INI

export function Avatar({ audioUrl, isPlaying }) {
  const { scene, animations } = useGLTF('/idle_Theresa.glb');
  const { actions } = useAnimations(animations, scene);
  
  const groupRef = useRef();
  const analyzer = useRef(null);
  const audioContext = useRef(null);
  
  // Buat state audio dengan setting crossOrigin
  const [audioElement] = useState(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // WAJIB untuk Web Audio API dari beda port
    return audio;
  });

  // --- PERBAIKAN MATERIAL TRANSPARAN (DOUBLE SIDE) ---
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          
          // Buat fungsi kecil agar rapi
          const fixMaterial = (mat) => {
            mat.side = THREE.DoubleSide; // Jaga-jaga untuk masalah dua sisi
            
            // PAKSA MATIKAN TRANSPARANSI (Ini biang kerok aslinya)
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
      });
    }
  }, [scene]);
  // ----------------------------------------------------

  useEffect(() => {
    if (isPlaying && audioUrl) {
      // Setup AudioContext HANYA sekali
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzer.current = audioContext.current.createAnalyser();
        analyzer.current.fftSize = 256; // Presisi analisis
        
        // Buat source dan sambungkan (Hanya lakukan sekali)
        const source = audioContext.current.createMediaElementSource(audioElement);
        source.connect(analyzer.current);
        analyzer.current.connect(audioContext.current.destination);
      }

      // Resume context jika ter-suspend oleh browser
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      audioElement.src = audioUrl;
      audioElement.play().catch(e => console.error("Gagal putar audio:", e));

    } else {
      // Pause audio jika isPlaying false
      audioElement.pause();
    }

    // Cleanup: Jangan close AudioContext, cukup pause audionya saja
    // karena kita ingin menggunakannya lagi di pesan berikutnya
    return () => {
      audioElement.pause();
    };
  }, [isPlaying, audioUrl, audioElement]);

  useFrame(() => {
    // Animasi bawaan jalan terus
    if (actions) {
      const animNames = Object.keys(actions);
      if (animNames.length > 0) actions[animNames[0]].play();
    }

    // FAKE LIP-SYNC: Skala berdenyut mengikuti suara
    if (isPlaying && analyzer.current && groupRef.current) {
      const data = new Uint8Array(analyzer.current.frequencyBinCount);
      analyzer.current.getByteFrequencyData(data);
      
      const volume = data.reduce((a, b) => a + b, 0) / data.length;
      
      // Jika volume 0, pulse = 1 (normal). Jika keras, pulse membesar.
      const pulse = 1 + (volume / 150); 
      groupRef.current.scale.set(pulse, pulse, pulse);
      
      groupRef.current.rotation.y += (Math.random() - 0.5) * (volume / 500);
    } else if (groupRef.current) {
      // Animasi lerp agar kembali ke bentuk asal secara halus saat suara berhenti
      groupRef.current.scale.lerp({ x: 1, y: 1, z: 1 }, 0.1);
    }
  });

  return (
    <Center>
      <primitive ref={groupRef} object={scene} />
    </Center>
  );
}