🧠 AI 3D Avatar Backend (Local LLM & Voice Edition)Server utama untuk proyek AI Avatar 3D. Backend ini berfungsi sebagai otak yang memproses logika percakapan secara lokal menggunakan Ollama, mengubah teks menjadi suara (Speech) menggunakan Piper TTS, dan menerjemahkan input suara menjadi teks menggunakan Whisper.cpp agar karakter 3D dapat "mendengar" dan "berbicara" secara interaktif.🛠️ Tech StackRuntime: Node.jsFramework: Express.jsLocal LLM Engine: Ollama (Model: qwen2.5:0.5b)Text-to-Speech (TTS): PiperSpeech-to-Text (STT): Whisper.cppProcessing: Multer (Upload) & FFmpeg (Audio Conversion)📂 Struktur Direktori WajibCatatan: Karena ukuran file yang besar, binary dan model AI tidak disertakan di GitHub. Kamu wajib menyusun folder seperti di bawah ini secara manual:Plaintextbackend/
├── bin/
│   ├── piper/
│   │   └── piper                 # (Executable Piper)
│   └── whisper.cpp/
│       └── whisper-cli           # (Executable Whisper STT)
├── models/
│   ├── ggml-base.bin             # (Model Whisper STT)
│   ├── id_ID-news_tts-medium.onnx      # (Model Suara Piper)
│   └── id_ID-news_tts-medium.onnx.json # (Config Suara Piper)
├── public/                       # (Output file audio .wav)
├── uploads/                      # (File rekaman sementara .webm)
└── local-chat.js                 # (Script Utama)
📋 PrasyaratSebelum menjalankan server, pastikan hal-hal berikut sudah siap di sistem kamu:Node.js (Versi 18.x atau lebih baru).FFmpeg & CMake sudah terinstall:Bashsudo apt install ffmpeg cmake
Ollama sudah terinstall dan model sudah di-pull:Bashollama pull qwen2.5:0.5b
Binary & Models:Unduh Piper dan model suara Indonesia (id_ID-news) dari Hugging Face.Build Whisper.cpp secara lokal dan ambil file whisper-cli.Letakkan semua file tersebut di folder bin/ dan models/ sesuai struktur di atas.⚙️ Instalasi & SetupIkuti langkah-langkah berikut untuk setup awal:Clone Repository:Bashgit clone -b backend https://github.com/AgielF/silly-Local-LLM-with-TTS-and-3d-Character.git
cd silly-Local-LLM-with-TTS-and-3d-Character/backend
Instal Dependensi:Bashnpm install
Beri Izin Eksekusi Binary (Linux/MacOS):Bashchmod +x bin/piper/piper
chmod +x bin/whisper.cpp/whisper-cli
Siapkan Folder Sementara:Bashmkdir -p uploads public
🚀 Menjalankan ServerPastikan service Ollama sudah aktif di background.Jalankan server:Bashnode local-chat.js
Server akan berjalan di: http://localhost:3000🛣️ API Endpoints1. Chat & Generate Speech (Teks)Endpoint: POST /api/chatParameterTipeDeskripsimessagestringPesan teks dari pengguna untuk dijawab oleh AI.Contoh Request:JSON{
  "message": "Halo, siapa kamu?"
}
Contoh Response:JSON{
  "reply": "Halo! Saya adalah asisten virtual Anda.",
  "audioUrl": "http://localhost:3000/speech_170123456.wav"
}
2. Voice Chat & Generate Speech (Audio)Endpoint: POST /api/chat-audioParameterTipeDeskripsiaudiofile/blobFile rekaman suara (.webm) dikirim via multipart/form-data.Contoh Response:JSON{
  "transcription": "Teks hasil pendengaran suara kamu.",
  "reply": "Jawaban dari AI berdasarkan teks di atas.",
  "audioUrl": "http://localhost:3000/speech_170123457.wav"
}
