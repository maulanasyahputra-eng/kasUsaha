# NEXORA DIGITAL — STATUS PRODUCTION-READY

Terakhir diperbarui: 30 Oktober 2026. Semua hasil di bawah berasal dari pengujian nyata
(pada instance lokal & database lokal), bukan asumsi.

---

## 1. DAFTAR FITUR YANG SUDAH DIUJI & BERFUNGSI

| #   | Skenario                                                                                                                                                                   | Hasil                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Register pelanggan (validasi password kuat, Argon2id)                                                                                                                      | ✅ PASS                                        |
| 2   | Login + logout (sesi server-side revocable; token mati setelah logout)                                                                                                     | ✅ PASS                                        |
| 3   | Produk ditampilkan dari database (bukan hardcode)                                                                                                                          | ✅ PASS                                        |
| 4   | Checkout — harga dihitung ulang backend, snapshot tersimpan, OrderTarget terpisah                                                                                          | ✅ PASS                                        |
| 5   | Pembayaran Midtrans — tanpa credential → pesan eksplisit `PAYMENT_NOT_CONFIGURED` (tidak pernah simulasi palsu). Dengan credential sandbox → Snap popup + QRIS/VA/E-wallet | ✅ KODE PASS / ⏳ butuh credential             |
| 6   | Webhook Midtrans — signature palsu ditolak (timing-safe SHA-512), payload malformed ditolak, duplikat idempotent                                                           | ✅ PASS (11 security test)                     |
| 7   | Verifikasi pembayaran ganda: signature + query status API Midtrans + cek nominal                                                                                           | ✅ PASS (kode; end-to-end butuh sandbox aktif) |
| 8   | Pengiriman ke provider — worker idempotent (`sentToProviderAt` guard); SIMULATION jelas berlabel; Digiflazz/Sosmedmedia adapter mengikuti dokumentasi resmi                | ✅ PASS / ⏳ butuh credential                  |
| 9   | Status pesanan diperbarui otomatis + OrderHistory lengkap                                                                                                                  | ✅ PASS                                        |
| 10  | Riwayat transaksi customer + halaman profil (ganti nama/password)                                                                                                          | ✅ PASS                                        |
| 11  | Login admin → dashboard 13 menu                                                                                                                                            | ✅ PASS                                        |
| 12  | Admin kelola produk/harga/kategori/promo + audit log                                                                                                                       | ✅ PASS (ubah harga teruji via API)            |
| 13  | Akses ilegal: customer → admin API = **403**                                                                                                                               | ✅ PASS                                        |
| 14  | Transaksi ganda: idempotency key → 1 order                                                                                                                                 | ✅ PASS                                        |
| 15  | Pembayaran gagal: saldo kurang = **409**; expire/cancel/deny webhook ditangani                                                                                             | ✅ PASS                                        |
| 16  | Rate limit brute-force login (10/15 menit) → 429                                                                                                                           | ✅ PASS                                        |
| 17  | SQL injection & XSS input ditolak; tidak ada stack trace bocor                                                                                                             | ✅ PASS                                        |
| 18  | Ulasan produk (hanya pembeli order SUCCESS; moderasi admin)                                                                                                                | ✅ PASS (kode)                                 |
| 19  | Health check `/api/health`, backup script, PM2 config, Nginx config siap                                                                                                   | ✅ PASS                                        |

## 2. YANG BELUM BISA DIAKTIFKAN — MENUNGGU CREDENTIAL PEMILIK

| Integrasi                         | Yang dibutuhkan                                                       | Status kode                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Midtrans **sandbox → production** | Server/Client key sandbox lalu merchant terverifikasi                 | Lengkap + webhook terverifikasi; tombol pembayaran menampilkan pesan jelas tanpa credential                                 |
| **Digiflazz** auto top-up         | Username + API key (+ aktivasi); sinkron katalog dari dashboard admin | Adapter sesuai dokumentasi (price-list, transaction, deposit/cek saldo, verifikasi callback sha256); `NOT CONFIGURED` jelas |
| **Sosmedmedia** SMM               | API key + base URL                                                    | Adapter `/services`, `/order`, `/status`; getBalance = BELUM DIIMPLEMENTASIKAN (tidak ada di docs publik)                   |
| Webhook **Digiflazz** receiver    | URL callback + endpoint publik                                        | Verifikasi signature sudah ada di adapter; route belum dipasang (catatan di SECURITY.md)                                    |
| Refund ke kartu via Midtrans API  | Merchant production                                                   | Refund internal ke wallet berfungsi + audit; API refund Midtrans manual via dashboard                                       |
| Email/WhatsApp notifikasi         | SMTP / WA Business API                                                | Notifikasi in-app aktif; channel eksternal belum                                                                            |

## 3. CREDENTIAL CHECKLIST (ringkas — detail di DEPLOYMENT.md)

1. Domain + DNS → VPS
2. VPS Ubuntu + MySQL 8 (user aplikasi non-root)
3. SSL Let's Encrypt
4. Midtrans: sandbox keys dulu → production setelah merchant verified
5. Digiflazz account aktif + API key
6. Sosmedmedia API key
7. (opsional) SMTP

## 4. CARA MULAI (3 langkah)

1. **Sekarang, tanpa credential apa pun**: website sudah bisa didemokan penuh —
   katalog, register/login, checkout, wallet, admin. Pembayaran otomatis & top-up otomatis
   baru jalan setelah langkah 2.
2. **Isi `.env`** (backend) dengan Midtrans sandbox keys + Digiflazz/Sosmedmedia keys →
   restart → klik **Sinkronkan Katalog Digiflazz** di admin → uji 1 transaksi sandbox end-to-end.
3. **Setelah semua uji sandbox lulus**: ganti ke production keys (Midtrans merchant verified),
   ikuti `DEPLOYMENT.md` → online.

## 5. FILE UTAMA

- `README.md` — instalasi lokal & arsitektur
- `DEPLOYMENT.md` — langkah deployment + credential
- `SECURITY.md` — audit keamanan lengkap
- `.env.example` / `.env.production.example` — template env
- `deploy/` — nginx.conf, backup-db.sh, uat.ps1 (UAT replay)
- `ecosystem.config.js` — PM2 (api + worker)
