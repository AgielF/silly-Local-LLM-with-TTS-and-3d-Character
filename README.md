# 🧠 AI 3D Avatar Backend (Local LLM Edition)

Server utama untuk proyek **AI Avatar 3D**. Backend ini berfungsi sebagai otak yang memproses logika percakapan secara lokal menggunakan **Ollama** dan mengubah teks menjadi suara (Speech) agar karakter 3D dapat "berbicara".

---

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express.js](https://expressjs.com/)
* **Local LLM Engine:** [Ollama](https://ollama.com/)
* **Model AI:** `qwen2.5:0.5b` (Ultralight & Fast)
* **Audio Processing:** [FS / Path] untuk manajemen file `.wav` sementara.

---

## 📋 Prasyarat

1.  **Node.js** (Versi 18.x atau lebih baru).
2.  **Ollama** terinstall di sistem. [Download di sini](https://ollama.com/download).
3.  **Model Qwen2.5 sudah di-pull:**
    Jalankan perintah ini di terminal kamu:
    ```bash
    ollama pull qwen2.5:0.5b
    ```

---

## ⚙️ Instalasi & Setup

1.  **Clone Repository:**
    ```bash
    git clone -b backend [https://github.com/agiel-fernanda/repository-kamu.git](https://github.com/agiel-fernanda/repository-kamu.git)
    cd backend
    ```

2.  **Instal Dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    Buat file `.env` di root folder backend:
    ```env
    PORT=3000
    FRONTEND_URL=http://localhost:5173
    # Tambahkan config lain jika diperlukan
    ```

---

## 🚀 Menjalankan Server

1.  **Pastikan Ollama Service aktif** (biasanya jalan otomatis di background).
2.  Jalankan server dalam mode pengembangan:
    ```bash
    npm run dev
    ```

Server akan berjalan di: `http://localhost:3000`

---

## 🛣️ API Endpoints

### 1. Chat & Generate Speech
**POST** `/chat`

| Parameter | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `message` | `string` | Pesan teks dari pengguna untuk dijawab oleh AI. |

**Contoh Request:**
```json
{
  "message": "Halo, siapa kamu?"
}
