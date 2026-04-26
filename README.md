

易 AI 3D Avatar Backend (Local LLM &
## Voice Edition)
Server utama untuk proyek AI Avatar 3D. Backend ini berfungsi sebagai otak yang
memproses logika percakapan secara lokal menggunakan Ollama, mengubah teks menjadi
suara (Speech) menggunakan Piper TTS, dan menerjemahkan input suara menjadi teks
menggunakan Whisper.cpp agar karakter 3D dapat "mendengar" dan "berbicara" secara
interaktif.

##  Tech Stack
## ● Runtime: Node.js
## ● Framework: Express.js
● Local LLM Engine: Ollama
● Model AI: qwen2.5:0.5b (Ultralight & Fast)
● Text-to-Speech (TTS): Piper
● Speech-to-Text (STT): Whisper.cpp
● File & Audio Processing: multer (Upload) dan FFmpeg (Konversi Audio).

##  Struktur Direktori Wajib
Karena ukuran file yang besar, binary dan model AI tidak disertakan di GitHub. Pastikan
struktur foldermu seperti ini setelah mengunduh prasyarat:
## Plaintext
backend/
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
└── local-chat.js


##  Prasyarat
- Node.js (Versi 18.x atau lebih baru).
- FFmpeg & CMake terinstall di sistem (sudo apt install ffmpeg cmake).
- Ollama terinstall di sistem. Download di sini.

Model Qwen2.5 sudah di-pull:
Jalankan perintah ini di terminal kamu:
## Bash
ollama pull qwen2.5:0.5b
## 4.
- Model & Binary Piper (TTS):
Unduh Piper dan model suara
id_ID-news_tts-medium.onnx dari Hugging Face, lalu
letakkan sesuai struktur direktori di atas.
- Model & Binary Whisper (STT):
Compile Whisper.cpp dan unduh model
ggml-base.bin, lalu letakkan sesuai struktur
direktori di atas.

## ⚙ Instalasi & Setup
## Clone Repository:
## Bash
git clone -b backend https://github.com/AgielF/silly-Local-LLM-with-TTS-and-3d-Character.git
cd silly-Local-LLM-with-TTS-and-3d-Character/backend
## 1.
## Instal Dependensi:
## Bash
npm install
## 2.
Beri Izin Eksekusi Binary (Khusus Linux/MacOS):
## Bash
chmod +x bin/piper/piper
chmod +x bin/whisper.cpp/whisper-cli
## 3.
## Siapkan Folder Sementara:
## Bash
mkdir -p uploads public
## 4.

##  Menjalankan Server
- Pastikan Ollama Service aktif (biasanya jalan otomatis di background).
Jalankan server utama:
## Bash
node local-chat.js
## 2.
Server akan berjalan di: http://localhost:3000


 API Endpoints
- Chat & Generate Speech (Teks)
POST /api/chat
## Parameter Tipe Deskripsi
message string Pesan teks dari pengguna untuk dijawab oleh AI.
## Contoh Request:
## JSON
## {
"message": "Halo, siapa kamu?"
## }

## Contoh Response:
## JSON
## {
"reply": "Halo! Saya adalah asisten virtual Anda.",
"audioUrl": "http://localhost:3000/speech_170123456.wav"
## }

- Voice Chat & Generate Speech (Audio)
POST /api/chat-audio
## Parameter Tipe Deskripsi
audio file/blob File rekaman suara (.webm) via multipart/form-data.
## Contoh Response:
## JSON
## {
"transcription": "Teks hasil pendengaran suara kamu.",
"reply": "Jawaban dari AI berdasarkan teks di atas.",
"audioUrl": "http://localhost:3000/speech_170123457.wav"
## }
