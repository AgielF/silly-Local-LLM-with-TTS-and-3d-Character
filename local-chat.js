import express from 'express';
import cors from 'cors';
import ollama from 'ollama';
import { spawn } from 'child_process'; // Tambahkan ini di sini
import path from 'path';
import fs from 'fs';

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

// Fungsi Helper: Menjalankan Piper TTS
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

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`\n💬 Pesan masuk: "${message}"`);

    try {
        // 1. Dapatkan jawaban teks dari Ollama
        console.log("⏳ AI sedang berpikir...");
        const response = await ollama.chat({
            model: 'qwen2.5:0.5b',
            messages: [{ role: 'user', content: message }]
        });

        const reply = response.message.content;
        console.log("✅ Teks selesai dibuat.");

        // 2. Ubah jawaban teks menjadi audio via Piper
        console.log("🗣️  Mengonversi teks ke suara...");
        const audioFile = await generateSpeech(reply);

        // 3. Kirim teks DAN link audio ke frontend
        res.json({ 
            reply, 
            audioUrl: `http://localhost:${PORT}/${audioFile}` 
        });
        
    } catch (error) {
        console.error("🔥 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Local AI + TTS berjalan di http://localhost:${PORT}`);
});