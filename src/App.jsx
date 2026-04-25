import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from './Avatar';

// ==========================================
// PENGONTROL KAMERA (ZOOM IN / OUT)
// ==========================================
function CameraController({ isPlaying, isVoiceMode }) {
  const { camera } = useThree();
  
  const defaultPosition = new THREE.Vector3(0, 1.2, 2.1);
  const defaultFov = 36;

  const zoomPosition = new THREE.Vector3(0, 1.2, 1.7); 
  const zoomFov = 32; 

  useFrame(() => {
    if (isPlaying || isVoiceMode) {
      camera.position.lerp(zoomPosition, 0.05);
      camera.fov = THREE.MathUtils.lerp(camera.fov, zoomFov, 0.05);
    } else {
      camera.position.lerp(defaultPosition, 0.05);
      camera.fov = THREE.MathUtils.lerp(camera.fov, defaultFov, 0.05);
    }
    camera.updateProjectionMatrix();
  });

  return null; 
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);

  const [currentAudio, setCurrentAudio] = useState(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Scroll otomatis: Pastikan hanya dipanggil jika ref tersedia
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isVoiceMode]);

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

      if (!response.ok) throw new Error('Gagal menghubungi server');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', content: data.reply }]);

      if (data.audioUrl) {
        setCurrentAudio(data.audioUrl);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'bot', content: '⚠️ Error server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) sendMessage();
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessingVoice(true);
      
      setTimeout(() => {
        setIsProcessingVoice(false);
        // setCurrentAudio('url.wav'); 
      }, 2000);
      
    } else {
      setIsRecording(true);
      setCurrentAudio(null); 
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f4f0] font-mono text-[#111] relative overflow-hidden">
      
      {/* TOMBOL PENGALIH MODE */}
      <button 
        onClick={() => setIsVoiceMode(!isVoiceMode)}
        className="absolute top-6 right-6 z-50 px-4 py-2 bg-black text-white font-bold border-2 border-white hover:bg-white hover:text-black transition-colors rounded shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"
      >
        {isVoiceMode ? "Kembali ke Chat" : "Masuk Mode Suara"}
      </button>

      {/* =========================================
          BAGIAN KIRI: KANVAS 3D AVATAR 
          (Akan melebar jadi 100% saat isVoiceMode aktif)
          ========================================= */}
      <div 
        className={`transition-all duration-500 ease-in-out relative border-[#111]
          ${isVoiceMode ? 'w-full h-full border-r-0' : 'w-1/2 border-r-4'}
        `}
        style={{
          backgroundImage: 'url(/bg.jpg)', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Canvas shadows>
          <CameraController isPlaying={!!currentAudio} isVoiceMode={isVoiceMode} />
          <Environment preset="apartment" />
          <ambientLight intensity={0.4} />
          <directionalLight castShadow position={[2, 3, 3]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
          
          <Suspense fallback={null}>
            <Avatar position={[0, -0.9, 0]} audioUrl={currentAudio} isPlaying={!!currentAudio} />
          </Suspense>

          <mesh receiveShadow position={[0, -0.9, -1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.4} /> 
          </mesh>
          
          <OrbitControls 
            enableZoom={false} enablePan={false} 
            enabled={!currentAudio && !isVoiceMode} 
            maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} 
          />
        </Canvas>

        {/* UI MIKROFON (Mode Suara) */}
        <div 
          className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-10 transition-opacity duration-300
            ${isVoiceMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className={`text-white font-mono font-bold tracking-widest text-sm uppercase px-4 py-1 rounded bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isRecording || isProcessingVoice || currentAudio ? 'opacity-100' : 'opacity-0'}`}>
            {isRecording && "● Merekam..."}
            {isProcessingVoice && "Menunggu Respons..."}
            {currentAudio && "AI Berbicara"}
          </div>

          <button 
            onClick={handleMicClick}
            disabled={isProcessingVoice || !!currentAudio}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center border-4 border-white transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]
              ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-black hover:bg-white hover:text-black text-white hover:scale-105'}
              ${(isProcessingVoice || !!currentAudio) ? 'opacity-50 cursor-not-allowed scale-90' : 'cursor-pointer'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 01-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* =========================================
          BAGIAN KANAN: PANEL CHAT TERMINAL
          Dibuat tetap ada di DOM (tidak di unmount), tapi lebarnya jadi 0 saat isVoiceMode aktif
          ========================================= */}
      <div 
        className={`transition-all duration-500 ease-in-out bg-white flex flex-col p-10 max-h-screen
          ${isVoiceMode ? 'w-0 opacity-0 p-0 overflow-hidden' : 'w-1/2 opacity-100'}
        `}
      >
        <h1 className="uppercase text-3xl font-extrabold tracking-widest border-b-4 border-[#111] pb-2 mb-8 whitespace-nowrap">
          /// Local LLM
        </h1>
        
        <div 
          className="flex-1 overflow-y-auto p-5 mb-5 bg-[#f4f4f0] border-4 border-[#111] shadow-[8px_8px_0px_#111]" 
          ref={chatBoxRef}
        >
          {messages.length === 0 && (
            <div className="text-center mt-5 text-gray-500 font-bold whitespace-nowrap">
              [ SISTEM SIAP. KETIKKAN PERINTAH. ]
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[75%] p-4 border-2 border-[#111] font-bold ${msg.role === 'user' ? 'bg-[#d1ffce] shadow-[4px_4px_0px_#111]' : 'bg-white shadow-[-4px_4px_0px_#111]'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex mb-4">
              <div className="max-w-[75%] p-4 border-2 border-[#111] font-bold bg-white shadow-[-4px_4px_0px_#111]">Memproses data...</div>
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
            className="px-8 py-4 text-base font-bold uppercase tracking-wide bg-[#111] text-white border-4 border-[#111] hover:bg-white hover:text-[#111]"
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