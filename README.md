# 💼 KasUsaha - Aplikasi Catatan Keuangan & Kas Usaha

> **Kelola Keuangan Usaha Anda Lebih Mudah, Cepat, dan Terorganisir!**

---

## 📌 Daftar Isi

- [📖 Tentang Proyek](#-tentang-proyek)
- [✨ Fitur Utama](#-fitur-utama)
- [🛠️ Spesifikasi & Teknologi](#-spesifikasi--teknologi)
- [🚀 Cara Menjalankan Proyek](#-cara-menjalankan-proyek)
- [📁 Struktur Direktori](#-struktur-direktori)
- [🗺️ Rencana Pengembangan (Roadmap)](#-rencana-pengembangan-roadmap)
- [🤝 Kontribusi](#-kontribusi)
- [📄 Lisensi](#-lisensi)

---

## 📖 Tentang Proyek

**KasUsaha** adalah aplikasi Android berbasis mobile yang dirancang khusus untuk membantu pemilik UMKM, pebisnis independen, maupun penggunaan pribadi dalam mencatat arus kas (*cashflow*), mengelola transaksi harian, dan memantau kesehatan keuangan bisnis secara *real-time*.

Dengan antarmuka yang ramah pengguna dan fitur yang praktis, Anda tidak perlu lagi mengandalkan pencatatan buku manual yang rawan hilang atau salah hitung.

---

## ✨ Fitur Utama

- 💰 **Pencatatan Pemasukan & Pengeluaran**  
  Catat setiap transaksi keuangan bisnis hanya dalam beberapa ketukan.

- 📊 **Laporan & Ringkasan Kas**  
  Dapatkan ringkasan saldo, total pemasukan, dan total pengeluaran secara transparan.

- 🗂️ **Kategori Transaksi Custom**  
  Kelompokkan transaksi berdasarkan kategori untuk analisis operasional yang lebih detail.

- 📅 **Filter Tanggal & Periode**  
  Pantau laporan keuangan secara harian, mingguan, hingga bulanan.

- 📱 **Antarmuka Responsif & Modern**  
  Desain intuitif yang mudah digunakan oleh siapa saja, dari pemula hingga profesional.

---

## 🛠️ Spesifikasi & Teknologi

- **Bahasa Pemrograman:** Kotlin / Java
- **Min SDK:** Android 5.0 (Lollipop - API Level 21)
- **Target SDK:** Android 14 / 15 (API Level 34/35)
- **Build System:** Gradle (v8.x+)
- **Arsitektur:** MVVM (Model-View-ViewModel)

### Komponen Utama:
- **Room Database:** Penyimpanan data lokal yang cepat dan aman.
- **LiveData & ViewModel:** Pengelolaan data terpisah dari siklus hidup UI.
- **ViewBinding / Jetpack Compose:** Komponen tampilan modern.
- **Material Design 3:** Antarmuka pengguna yang bersih dan konsisten.

---

## 🚀 Cara Menjalankan Proyek

### 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:
- [Android Studio](https://developer.android.com/studio) (versi terbaru direkomendasikan)
- JDK 17 atau yang sesuai
- Perangkat Android (Fisik atau Emulator) dengan USB Debugging aktif

### 🛠️ Langkah Instalasi

1. **Clone Repositori Ini**
```bash
git clone https://github.com/username/kasUsaha.git
cd kasUsaha
```

2. **Buka Proyek di Android Studio**
- Jalankan **Android Studio**.
- Pilih **Open an Existing Project** dan arahkan ke folder `kasUsaha`.

3. **Build & Sync Gradle**
- Biarkan Android Studio mengunduh dependensi dan menyelaraskan (*sync*) Gradle secara otomatis.

4. **Jalankan Aplikasi**
- Hubungkan perangkat Android Anda atau jalankan Emulator.
- Tekan tombol **Run** (`Shift + F10`) di Android Studio.

---

## 📁 Struktur Direktori

```text
kasUsaha/
├── app/                      # Kode sumber utama aplikasi Android
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/kasusaha/   # Logika bisnis & UI (Kotlin/Java)
│   │   │   ├── res/                 # Layout XML, Drawable, Values
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle      # Konfigurasi dependensi modul app
├── docs/                     # Dokumentasi & screenshot aplikasi
├── gradle/                   # Pembungkus (wrapper) Gradle
├── build.gradle              # Konfigurasi Gradle tingkat proyek
└── settings.gradle           # Pengaturan modul proyek
```

---

## 🗺️ Rencana Pengembangan (Roadmap)

- [x] Pencatatan arus kas harian (Pemasukan & Pengeluaran)
- [x] Laporan ringkasan saldo
- [ ] Ekspor laporan keuangan ke format PDF & Excel (.xlsx)
- [ ] Backup & Restore data otomatis via Google Drive
- [ ] Dukungan Mode Gelap (*Dark Mode*)

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda ingin membantu mengembangkan aplikasi ini:

1. **Fork** repositori ini.
2. **Buat branch fitur baru**:
   ```bash
   git checkout -b feature/fitur-baru
   ```
3. **Commit perubahan Anda**:
   ```bash
   git commit -m "Menambahkan fitur baru"
   ```
4. **Push ke branch tersebut**:
   ```bash
   git push origin feature/fitur-baru
   ```
5. Buat **Pull Request**.

---

## 📄 Lisensi

Proyek ini dilindungi di bawah lisensi [MIT License](LICENSE).
