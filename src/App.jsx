import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei'; 
import * as THREE from 'three';
import { Avatar } from './Avatar';

// ==========================================
// PENGONTROL KAMERA: MENGATUR ZOOM IN / OUT
// ==========================================
function CameraController({ isPlaying }) {
  const { camera } = useThree();
  
  // Posisi diam (default). 
  const defaultPosition = new THREE.Vector3(0, 1.2, 2.1);
  const defaultFov = 36;

  // PERBAIKAN ZOOM: 
  // Nilai Z tidak terlalu kecil (mundur sedikit dari 1.5 ke 1.7) agar kepala tidak terpotong.
  // Nilai Y juga disesuaikan ke 1.2 (sama dengan default) agar kamera tidak terlalu mendongak.
  const zoomPosition = new THREE.Vector3(0, 1.2, 1.7); 
  const zoomFov = 32; 

  useFrame(() => {
    if (isPlaying) {
      camera.position.lerp(zoomPosition, 0.05);
      camera.fov = THREE.MathUtils.lerp(camera.fov, zoomFov, 0.05);
      camera.updateProjectionMatrix();
    } else {
      const distance = camera.position.distanceTo(defaultPosition);
      if (distance > 0.05) {
        camera.position.lerp(defaultPosition, 0.05);
        camera.fov = THREE.MathUtils.lerp(camera.fov, defaultFov, 0.05);
        camera.updateProjectionMatrix();
      }
    }
  });

  return null; 
}
// ==========================================


function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setCurrentAudio(null); 

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi server lokal');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', content: data.reply }]);

      if (data.audioUrl) {
        setCurrentAudio(data.audioUrl);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'bot', content: '⚠️ Error: Koneksi ke server terputus.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f4f0] font-mono text-[#111]">
      
      {/* PANEL KIRI: 3D CHARACTER */}
      <div 
        className="flex-1 border-r-4 border-[#111] relative overflow-hidden"
        style={{
          backgroundImage: 'url(/bg.jpg)', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Canvas shadows>
          
          <CameraController isPlaying={!!currentAudio} />

          <Environment preset="apartment" />
          
          <ambientLight intensity={0.4} />
          <directionalLight 
            castShadow 
            position={[2, 3, 3]} 
            intensity={1.5} 
            shadow-mapSize={[1024, 1024]} 
          />
          
          <Suspense fallback={null}>
            {/* KOORDINAT DIKEMBALIKAN KE VERSI ASLI KAMU */}
            <Avatar 
              position={[0, -0.9, 0]} 
              audioUrl={currentAudio} 
              isPlaying={!!currentAudio} 
            />
          </Suspense>

          {/* KOORDINAT DIKEMBALIKAN KE VERSI ASLI KAMU */}
          <mesh receiveShadow position={[0, -0.9, -1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.4} /> 
          </mesh>
          
          {/* ORBIT CONTROLS AKTIF SAAT DIAM, MATI SAAT ZOOM */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            enabled={!currentAudio} 
            maxPolarAngle={Math.PI / 2} 
            minPolarAngle={Math.PI / 3} 
          />
        </Canvas>
      </div>

      {/* PANEL KANAN: CHAT TERMINAL */}
      <div className="flex-1 flex flex-col p-10 max-h-screen bg-white">
        <h1 className="uppercase text-3xl font-extrabold tracking-widest border-b-4 border-[#111] pb-2 mb-8">
          /// Local LLM
        </h1>
        
        <div 
          className="flex-1 overflow-y-auto p-5 mb-5 bg-[#f4f4f0] border-4 border-[#111] shadow-[8px_8px_0px_#111]" 
          ref={chatBoxRef}
        >
          {messages.length === 0 && (
            <div className="text-center mt-5 text-gray-500 font-bold">
              [ SISTEM SIAP. KETIKKAN PERINTAH. ]
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              <div 
                className={`max-w-[75%] p-4 border-2 border-[#111] font-bold ${
                  msg.role === 'user' 
                    ? 'bg-[#d1ffce] shadow-[4px_4px_0px_#111]' 
                    : 'bg-white shadow-[-4px_4px_0px_#111]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex mb-4">
              <div className="max-w-[75%] p-4 border-2 border-[#111] font-bold bg-white shadow-[-4px_4px_0px_#111]">
                Memproses data...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5">
          <input
            type="text"
            className="flex-1 p-4 text-base font-mono border-4 border-[#111] bg-white outline-none focus:bg-[#eaffea]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Masukkan instruksi..."
            disabled={isLoading}
          />
          <button 
            className="px-8 py-4 text-base font-bold uppercase tracking-wide bg-[#111] text-white border-4 border-[#111] transition-all duration-200 hover:bg-white hover:text-[#111] hover:shadow-[6px_6px_0px_#111] hover:-translate-y-1 hover:-translate-x-1 disabled:bg-gray-500 disabled:border-gray-500 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:text-white"
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
          >
            Execute
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default App;