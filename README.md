# 🚀 AI 3D Avatar Frontend

Antarmuka web interaktif yang menampilkan **Avatar 3D** dengan fitur **Real-time Animation** dan **Audio-driven Lip-Sync**. Proyek ini merupakan bagian dari pengembangan asisten virtual berbasis AI.

---

## 🛠️ Tech Stack

Frontend ini dibangun menggunakan teknologi modern untuk performa rendering 3D yang optimal di browser:

* **Framework:** [Vite](https://vitejs.dev/) + [React 18](https://reactjs.org/)
* **3D Engine:** [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js React bridge)
* **Utilities:** [@react-three/drei](https://github.com/pmndrs/drei) (Helper untuk kamera, model, dan teks)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Brutalism UI Style)
* **Animation:** [Mixamo](https://www.mixamo.com/) (Rigging & Idle Animation)
* **Asset 3D:** [thatnewdevgirl](https://thatnewdevgirl.itch.io/free-3d-anime-girl-theresa) (Rigging & Idle Animation)

---

## 📋 Prasyarat

Sebelum memulai, pastikan perangkat kamu sudah terinstall:
* **Node.js** (Versi 18.x atau lebih baru)
* **NPM** atau **Yarn**
* **Backend AI Service** (Sudah berjalan untuk menyuplai audio dan teks)

---

## ⚙️ Instalasi & Setup

1.  **Clone Repository:**
    ```bash
    git clone -b frontend [https://github.com/agiel-fernanda/repository-kamu.git](https://github.com/agiel-fernanda/repository-kamu.git)
    cd frontend
    ```

2.  **Instal Dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    Buat file `.env` di root folder frontend dan masukkan URL backend kamu:
    ```env
    VITE_BACKEND_URL=http://localhost:3000
    ```

4.  **Aset Model 3D:**
    Pastikan model karakter kamu sudah diletakkan di:
    `public/idle_Theresa.glb`

---

## 🚀 Menjalankan Aplikasi

Jalankan server pengembangan:

```bash
npm run dev
