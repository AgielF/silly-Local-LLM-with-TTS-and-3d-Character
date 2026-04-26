import express from 'express';
import cors from 'cors';
import ollama from 'ollama';
import { spawn, exec } from 'child_process'; // exec ditambahkan untuk FFmpeg
import path from 'path';
import fs from 'fs';
import util from 'util';
import multer from 'multer';

// Mengubah exec menjadi berbasis Promise agar mudah di-await
const execAsync = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// PENTING: Izinkan frontend akses file audio di folder public
app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*'); // Izinkan akses dari mana saja
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Konfigurasi Multer untuk menerima file audio dari frontend dan menyimpannya di folder 'uploads' sementara
const upload = multer({ dest: 'uploads/' });

// Konfigurasi Path STT Whisper
// (Ubah 'main' menjadi 'whisper-cli' jika file binary kamu bernama whisper-cli)
const WHISPER_BIN_PATH = path.join(process.cwd(), 'bin', 'whisper.cpp', 'whisper-cli'); 
const WHISPER_MODEL_PATH = path.join(process.cwd(), 'models', 'ggml-base.bin');


// ==========================================
// FUNGSI HELPER
// ==========================================

// 1. Menjalankan Piper TTS
const generateSpeech = (text) => {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const fileName = `speech_${timestamp}.wav`;
        const outputPath = path.join(process.cwd(), 'public', fileName);
        const modelPath = path.join(process.cwd(), 'models', 'id_ID-news_tts-medium.onnx');
        const piperPath = path.join(process.cwd(), 'bin', 'piper', 'piper');

        // Mempersiapkan proses Piper
        const child = spawn(piperPath, [
            '--model', modelPath,
            '--output_file', outputPath
        ]);

        // Mengirim teks ke Piper melalui stdin
        child.stdin.write(text);
        child.stdin.end();

        child.on('close', (code) => {
            if (code === 0) {
                resolve(fileName);
            } else {
                console.error(`❌ Piper gagal dengan kode: ${code}`);
                reject(new Error(`Piper exit code: ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error("❌ Gagal menjalankan Piper:", err);
            reject(err);
        });
    });
};

// 2. Menjalankan STT (Whisper.cpp)
const transcribeAudio = async (tempWebmPath) => {
    const wavOutputPath = `${tempWebmPath}.wav`;

    try {
        console.log("⚙️ Mengonversi WebM ke WAV (16kHz) via FFmpeg...");
        // Konversi file WebM dari browser menjadi WAV 16kHz mono (syarat dari Whisper)
        await execAsync(`ffmpeg -i ${tempWebmPath} -ar 16000 -ac 1 -c:a pcm_s16le ${wavOutputPath} -y`);

        console.log("📝 Memulai mesin Whisper STT...");
        return new Promise((resolve, reject) => {
            const child = spawn(WHISPER_BIN_PATH, [
                '-m', WHISPER_MODEL_PATH,
                '-f', wavOutputPath,
                '-nt',       // Hilangkan format timestamp di output teks
                '-l', 'id'   // Paksa deteksi ke bahasa Indonesia
            ]);

            let transcription = '';

            child.stdout.on('data', (data) => {
                transcription += data.toString();
            });

            // Abaikan output stderr dari whisper karena isinya hanya log pemrosesan
            child.stderr.on('data', (data) => {
            console.error(`🔍 Log Whisper: ${data.toString()}`);
            });

            child.on('close', (code) => {
                // Hapus file sampah sementara (WebM asli dan WAV hasil konversi)
                //if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                //if (fs.existsSync(wavOutputPath)) fs.unlinkSync(wavOutputPath);

                if (code === 0) {
                    resolve(transcription.trim());
                } else {
                    reject(new Error(`Whisper gagal dengan kode: ${code}`));
                }
            });

            child.on('error', (err) => {
                // Hapus file sampah jika terjadi error sistem
                //if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                //if (fs.existsSync(wavOutputPath)) fs.unlinkSync(wavOutputPath);
                reject(err);
            });
        });
    } catch (err) {
        console.error("❌ Gagal memproses audio dengan FFmpeg:", err);
        throw err;
    }
};


// ==========================================
// ENDPOINT API
// ==========================================

// [MODE TEKS] Endpoint lama untuk chat biasa
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`\n💬 Pesan teks masuk: "${message}"`);

    try {
        console.log("⏳ AI sedang berpikir...");
        const response = await ollama.chat({
            model: 'qwen2.5:0.5b',
            messages: [{ role: 'user', content: message }]
        });

        const reply = response.message.content;
        console.log("✅ Teks selesai dibuat.");

        console.log("🗣️  Mengonversi teks ke suara...");
        const audioFile = await generateSpeech(reply);

        res.json({ 
            reply, 
            audioUrl: `http://localhost:${PORT}/${audioFile}` 
        });
        
    } catch (error) {
        console.error("🔥 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// [MODE SUARA] Endpoint baru untuk menerima file audio dari mikrofon
app.post('/api/chat-audio', upload.single('audio'), async (req, res) => {
    // req.file akan berisi data audio dari frontend
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file audio yang diterima server.' });
    }

    const tempAudioPath = req.file.path;
    console.log(`\n🎤 Suara diterima (Disimpan di: ${tempAudioPath})`);

    try {
        // 1. Transkripsi suara ke teks
        const userMessage = await transcribeAudio(tempAudioPath);
        console.log(`🗣️  Terjemahan: "${userMessage}"`);

        if (!userMessage || userMessage.trim() === "") {
             throw new Error("Transkripsi kosong. Suara kurang jelas.");
        }

        // 2. Kirim teks ke LLM Ollama
        console.log("⏳ AI sedang memikirkan jawaban...");
        const response = await ollama.chat({
            model: 'qwen2.5:0.5b',
            messages: [{ role: 'user', content: userMessage }]
        });
        const reply = response.message.content;
        console.log("✅ Jawaban AI selesai dirakit.");

        // 3. Ubah teks balasan menjadi suara
        console.log("🗣️  Mengonversi jawaban ke suara...");
        const audioFile = await generateSpeech(reply);

        // 4. Kembalikan semua data ke frontend
        res.json({ 
            transcription: userMessage, // Omongan asli user (untuk ditampilkan di layar)
            reply: reply,               // Teks balasan AI
            audioUrl: `http://localhost:${PORT}/${audioFile}` 
        });
        
    } catch (error) {
        console.error("🔥 Error di /api/chat-audio:", error.message);
        
        // Pengaman ekstra: Hapus file temporary jika tiba-tiba aplikasi crash
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Local AI + TTS berjalan di http://localhost:${PORT}`);
});