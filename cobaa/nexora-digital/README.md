# NEXORA DIGITAL

**One Platform. Endless Digital Possibilities.**

Platform penjualan produk digital: **top up diamond/mata uang game**, **layanan media sosial (SMM)**,
dengan pembayaran otomatis **Midtrans**, sistem **saldo/deposit berbasis ledger**, dashboard
customer & admin, serta arsitektur **provider adapter** (Digiflazz, Sosmedmedia, Simulation).

> ⚠️ **Jujur soal status integrasi:** adapter Digiflazz/Sosmedmedia hanya aktif jika kredensial
> resmi tersedia di `.env`. Tanpa kredensial, hanya provider **SIMULATION** yang aktif — semua
> transaksi dari provider ini **berlabel simulasi** dan TIDAK merupakan transaksi nyata.
> Bagian yang belum bisa diverifikasi dari dokumentasi ditandai `BELUM DIIMPLEMENTASIKAN`.

---

## Teknologi

| Layer     | Teknologi                                                                               |
| --------- | --------------------------------------------------------------------------------------- |
| Frontend  | React 18, Vite 5, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, Lucide |
| Backend   | Node.js, Express 4, TypeScript, Prisma ORM, JWT, bcrypt, Zod, Helmet, rate-limit, pino  |
| Database  | MySQL 8 (migrasi via Prisma Migrate)                                                    |
| Payment   | Midtrans Snap (sandbox & production), webhook terverifikasi signature SHA-512           |
| Testing   | Jest + ts-jest, mock provider (tanpa uang nyata)                                        |
| Dev infra | Docker Compose (MySQL + Redis)                                                          |

## Struktur Folder

```
nexora-digital/
├── .env.example
├── docker-compose.yml          # MySQL + Redis untuk development
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # User, Wallet+Ledger, Order, Payment, Provider, dst.
│   │   └── seed.ts             # Seed DEVELOPMENT (admin dev + katalog contoh)
│   ├── src/
│   │   ├── config/             # env + logger (secret di-redact dari log)
│   │   ├── middleware/         # auth JWT, optionalAuth, error handler + zod
│   │   ├── providers/          # base-provider, digiflazz, sosmedmedia, registry, midtrans
│   │   ├── routes/             # auth, catalog, orders, payments/webhook, account, admin
│   │   ├── services/           # order.service, payment.service, wallet.service, order-worker
│   │   └── index.ts / worker.ts
│   └── tests/                  # Jest (unit + service), mock provider
└── frontend/
    └── src/
        ├── components/         # Navbar, Footer, Logo, UI kit (badge, toast, skeleton)
        ├── hooks/              # auth context
        └── pages/              # Landing, Catalog, Detail, Checkout, Status, Track,
                                # Login, Register, Dashboard, Wallet, Admin, 404
```

---

## Instalasi Lokal

### Prasyarat

- Node.js ≥ 20
- MySQL 8 (lokal, atau via `docker compose up -d mysql`)
- (Opsional) Redis

### Langkah

```bash
# 1. Database (pilih salah satu)
docker compose up -d mysql
# ...atau pakai MySQL lokal; sesuaikan DATABASE_URL

# 2. Backend
cd backend
cp ../.env.example .env          # WAJIB isi JWT_SECRET & DATABASE_URL
npm install
npm approve-scripts prisma @prisma/engines   # bila npm memblokir postinstall
npx prisma migrate dev --name init
npm run seed                     # SEED DEVELOPMENT SAJA
npm run dev                      # API di http://localhost:5000

# 3. Worker (proses order otomatis)
npm run worker

# 4. Frontend
cd ../frontend
npm install
npm run dev                      # http://localhost:5173 (proxy /api -> :5000)
```

### Akun seed (HANYA development)

- Admin: `admin@nexora.test` / `ChangeMe_Now!2026`
- Customer: `demo@nexora.test` / `Demo1234!`

**Produksi:** jangan pakai seed. Buat admin dengan:

```bash
node -e "require('bcryptjs').hash(process.argv[1],12).then(h=>console.log(h))" "PasswordKuatAnda"
```

lalu insert user role ADMIN via SQL/script, atau pakai seed lalu **segera ganti password** dan
nonaktifkan email seed.

---

## Konfigurasi Provider

### Midtrans (https://docs.midtrans.com)

1. Daftar Midtrans, ambil **Sandbox** Server Key & Client Key dari dashboard.
2. Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION=false`.
3. Webhook (Payment Notification URL): `https://domain-anda/api/webhooks/midtrans`
   — harus publik & HTTPS di production.
4. Sistem memverifikasi: signature SHA-512 lokal **dan** query status ke API Midtrans,
   plus pencocokan nominal. Webhook duplikat di-idempotency-kan lewat tabel `WebhookEvent`
   dan row-lock pada order.

### Digiflazz (https://developer.digiflazz.com/api/buyer/topup/)

1. Isi `DIGIFLAZZ_USERNAME`, `DIGIFLAZZ_API_KEY`, `DIGIFLAZZ_BASE_URL`.
2. Daftarkan callback Digiflazz ke endpoint Anda (perlu route webhook Digiflazz —
   lihat catatan BELUM DIIMPLEMENTASIKAN di bawah).
3. Sinkron katalog: login admin → **Sinkronkan Katalog Digiflazz**.
   Hanya produk **prepaid** yang disinkron; harga jual = cost × 1.05 (ubah per produk).

### Sosmedmedia (https://sosmedmedia.com/api-docs)

1. Isi `SOSMEDMEDIA_API_KEY`, `SOSMEDMEDIA_API_BASE_URL`.
2. Adapter mengimplementasikan `/services`, `/order`, `/status` sesuai dokumentasi.
3. Cek saldo provider: **BELUM DIIMPLEMENTASIKAN** (endpoint tidak terverifikasi publik).

### Mode Simulasi

Tanpa kredensial provider, produk menggunakan provider `SIMULATION` (dibuat oleh seed).
Semua transaksi SIMULATION tersimpan dengan provider code itu sendiri sehingga **dapat
dipisahkan** dari data production saat pelaporan. Jangan pernah menjalankan SIMULATION
di production.

---

## API Internal (ringkas)

| Method         | Endpoint                                                                                         | Auth                | Fungsi                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------- |
| POST           | /api/auth/register, /api/auth/login                                                              | —                   | Registrasi & login (rate-limited, lockout 5 gagal)                |
| GET            | /api/auth/me                                                                                     | Bearer              | Profil + saldo                                                    |
| GET            | /api/categories, /api/products, /api/products/:slug                                              | —                   | Katalog publik (cost price tidak diekspos)                        |
| GET            | /api/status                                                                                      | —                   | Status provider + mode sistem                                     |
| POST           | /api/orders                                                                                      | optional            | Buat order (harga dihitung server, idempotency key)               |
| POST           | /api/orders/:id/pay                                                                              | optional            | Buat Snap transaction Midtrans                                    |
| POST           | /api/orders/:id/pay-wallet                                                                       | Bearer              | Bayar dengan saldo (row-lock)                                     |
| GET            | /api/orders/:id, /api/orders/:id/status                                                          | guest token / owner | Status + riwayat                                                  |
| POST           | /api/orders/track                                                                                | —                   | Lacak order (guest wajib verifikasi)                              |
| POST           | /api/payments/deposit                                                                            | Bearer              | Buat deposit Snap                                                 |
| POST           | /api/webhooks/midtrans                                                                           | signature           | Webhook pembayaran                                                |
| GET            | /api/account/orders, /api/account/wallet, /api/account/wallet/ledger, /api/account/notifications | Bearer              | Akun customer                                                     |
| GET/POST/PATCH | /api/admin/\*                                                                                    | ADMIN               | Dashboard, orders, products, providers, refunds, audit-logs, sync |

Format error konsisten: `{ "error": { "code": "...", "message": "..." } }`.

---

## Integritas Keuangan (penting)

1. **Ledger immutable** — saldo hanya berubah via `applyWalletChange()` yang mencatat
   balance before/after + referensi. Tidak ada update saldo langsung.
2. **Idempotent** — entri ledger dengan (type, referenceType, referenceId) tidak pernah ganda;
   webhook Midtrans duplikat tidak menambah saldo/paid dua kali.
3. **Row locking** (`SELECT ... FOR UPDATE`) mencegah saldo negatif saat konkuren.
4. **Snapshot harga** tersimpan di order; perubahan harga produk tidak memengaruhi order lama.
5. Order ID internal ≠ externalId Midtrans ≠ providerRef Digiflazz/Sosmed.
6. Refund hanya lewat admin endpoint dengan syarat PAID + FAILED + audit log; tidak otomatis.
7. Worker **tidak pernah** mengirim ulang ke provider jika `sentToProviderAt` sudah terisi —
   status tidak pasti masuk rekonsiliasi, bukan retry buta.

## BELUM DIIMPLEMENTASIKAN (transparan)

- **Webhook receiver Digiflazz** — route belum dibuat; verifikasi signature sudah tersedia
  di adapter (`verifyCallbackSign`) tinggal dipasang ke route + update ProviderTransaction.
- **Sosmedmedia getBalance** — endpoint tidak terverifikasi.
- **Refund via Midtrans API** — refund ditangani manual oleh admin (refund ke wallet internal);
  refund ke kartu via Midtrans API belum dipasang.
- **Redis/BullMQ queue** — worker berjalan dengan polling DB; antrean dapat ditukar tanpa
  mengubah logika order.

---

## Testing

```bash
cd backend
# butuh DATABASE_URL menunjuk DB TEST/dev, bukan production:
$env:DATABASE_URL="mysql://root:password@localhost:3306/nexora_test"; npm test
```

Mencakup (menggunakan mock provider, tanpa uang nyata): harga dihitung server, produk
nonaktif, idempotency order, ledger idempotent, saldo tidak negatif saat race, skip order
belum dibayar, tidak kirim ulang ke provider, nominal mismatch ditolak, webhook duplikat,
signature Digiflazz valid/invalid, mock provider sukses/gagal/timeout.

**Integration test sandbox** (Midtrans/Digiflazz) dijalankan manual terpisah dengan kredensial
sandbox — tidak pernah memakai kredensial production.

---

## Deployment (ringkas)

1. VPS + Node 20, MySQL 8, Nginx (HTTPS via Let's Encrypt).
2. `NODE_ENV=production`, isi semua secret di `.env` (permission 600, tidak di Git).
3. `npx prisma migrate deploy` (JANGAN `migrate dev` di production).
4. Buat admin secara aman (lihat atas) — hapus/ubah akun seed.
5. Jalankan: `npm run build && npm start` (API) dan `npm run start:worker` (worker)
   — disarankan via systemd/PM2.
6. Webhook Midtrans harus publik HTTPS; set URL di dashboard Midtrans.
7. Backup: `mysqldump --single-transaction nexora | gzip > backup-$(date +%F).sql.gz`
   — jadwalkan cron; uji restore secara berkala.
8. Rotasi secret: ganti JWT_SECRET (memaksa re-login), rotasi server key Midtrans di dashboard
   lalu update .env + restart.
9. Monitoring: log pino terstruktur; pantau tabel WebhookEvent (FAILED) & OrderHistory
   (RECONCILE_NEEDED).

## Troubleshooting

| Masalah                                        | Penyebab & Solusi                                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Environment variable not found: DATABASE_URL` | `.env` belum dibuat/isi di backend.                                                                        |
| `P1001: Can't reach database`                  | MySQL belum jalan / DATABASE_URL salah / firewall.                                                         |
| Webhook ditolak `INVALID_SIGNATURE`            | Server key salah (sandbox vs production), atau payload termodifikasi proxy. Pastikan body diteruskan utuh. |
| `PAYMENT_NOT_CONFIGURED`                       | MIDTRANS_SERVER_KEY kosong.                                                                                |
| Pesanan stuck PROCESSING/UNKNOWN               | Provider timeout; cek rekonsiliasi manual di dashboard provider, lalu update via admin (dengan bukti).     |
| Sinkron Digiflazz kosong                       | Kredensial salah atau akun belum aktif; cek log backend.                                                   |
