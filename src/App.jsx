import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Avatar } from './Avatar';
// Hapus import './App.css'; jika semua CSS-nya sudah diganti ke Tailwind di index.css

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
      <div className="flex-1 bg-black border-r-4 border-[#111] relative">
        <Canvas camera={{ position: [0, 1, 5], fov: 40 }}>
          <ambientLight intensity={1.2} />
          <pointLight position={[5, 5, 5]} intensity={2} />
          <Environment preset="city" />
          
          <Suspense fallback={null}>
            <Avatar 
              audioUrl={currentAudio} 
              isPlaying={!!currentAudio} 
            />
          </Suspense>
          
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* PANEL KANAN: CHAT TERMINAL */}
      <div className="flex-1 flex flex-col p-10 max-h-screen">
        <h1 className="uppercase text-3xl font-extrabold tracking-widest border-b-4 border-[#111] pb-2 mb-8">
          /// Local LLM
        </h1>
        
        <div 
          className="flex-1 overflow-y-auto p-5 mb-5 bg-white border-4 border-[#111] shadow-[8px_8px_0px_#111]" 
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
                    : 'bg-[#ececec] shadow-[-4px_4px_0px_#111]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex mb-4">
              <div className="max-w-[75%] p-4 border-2 border-[#111] font-bold bg-[#ececec] shadow-[-4px_4px_0px_#111]">
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