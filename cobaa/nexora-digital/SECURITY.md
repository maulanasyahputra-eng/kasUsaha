# NEXORA DIGITAL — LAPORAN AUDIT KEAMANAN

Tanggal audit: 30 Oktober 2026 (diulang setelah setiap perbaikan)
Lingkup: seluruh backend, frontend, konfigurasi, integrasi Midtrans & provider.
Metode: review kode manual + pengujian otomatis (Jest) + penetrasi HTTP live pada instance lokal.

---

## 1. KERENTANAN YANG DITEMUKAN & STATUS

| #   | Kerentanan                                                                                                   | Severity     | Status                                                                                                | Lokasi perbaikan                                                            |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **JWT stateless — tidak bisa dicabut**: logout hanya menghapus localStorage; token curian tetap valid 7 hari | **CRITICAL** | ✅ FIXED                                                                                              | `middleware/auth.ts`, `routes/auth.routes.ts`, `frontend/hooks/use-auth.ts` |
| 2   | **Role dari klaim JWT, bukan DB**: jika role di DB diubah/di-downgrade, token lama masih berlaku             | **HIGH**     | ✅ FIXED                                                                                              | `middleware/auth.ts` — role dibaca dari `session.user.role`                 |
| 3   | **Password bcrypt cost 12** — masih kuat tapi di bawah rekomendasi OWASP 2024                                | **MEDIUM**   | ✅ FIXED → **Argon2id** (m=19MiB, t=2, p=1)                                                           | `routes/auth.routes.ts`, `prisma/seed.ts`, `tests/helpers.ts`               |
| 4   | **Tidak ada logout server-side** (revoke)                                                                    | HIGH         | ✅ FIXED                                                                                              | `POST /api/auth/logout` + tabel `Session`                                   |
| 5   | **Password policy lemah** (min 8, tanpa kompleksitas)                                                        | MEDIUM       | ✅ FIXED — min 10, wajib huruf besar/kecil/angka                                                      | `routes/auth.routes.ts`                                                     |
| 6   | **Ganti password tanpa konfirmasi password lama**                                                            | HIGH         | ✅ FIXED — wajib `currentPassword`; semua sesi lain dicabut                                           | `routes/auth.routes.ts`                                                     |
| 7   | **Webhook signature comparison non timing-safe** (`===` pada hex)                                            | MEDIUM       | ✅ FIXED — `crypto.timingSafeEqual` + validasi panjang hex 128                                        | `routes/payment.routes.ts`                                                  |
| 8   | **Payload webhook tidak divalidasi bentuknya** sebelum masuk log/DB                                          | MEDIUM       | ✅ FIXED — Zod shape validation + regex ketat per field                                               | `routes/payment.routes.ts`                                                  |
| 9   | **Helmet default** tanpa CSP ketat; HSTS tidak aktif                                                         | MEDIUM       | ✅ FIXED — CSP custom (Midtrans allowlist), HSTS production-only, frameAncestors none, objectSrc none | `index.ts`                                                                  |
| 10  | **Rate limit global saja** (300/min) — login bisa 300 percobaan/menit                                        | **HIGH**     | ✅ FIXED — auth limiter 10/15 menit → terbukti 429 pada percobaan ke-7                                | `routes/auth.routes.ts`                                                     |
| 11  | **Body limit 1MB** — terlalu besar untuk API JSON                                                            | LOW          | ✅ FIXED → 64kb (webhook 256kb raw)                                                                   | `index.ts`                                                                  |
| 12  | **Error handler bisa membocorkan stack** di production (logger.info pino)                                    | LOW          | ✅ SUDAH AMAN — diverifikasi: response tanpa stack/node_modules                                       | `middleware/error.ts` + test                                                |
| 13  | **User enumeration**: register menyebut "email sudah terdaftar"                                              | LOW          | ✅ FIXED — pesan generik                                                                              | `routes/auth.routes.ts`                                                     |
| 14  | **XSS via nama user** — regex nama menerima `<b>`, `<img>`                                                   | MEDIUM       | ✅ FIXED — whitelist `[\p{L}\p{N} .'-]` saja; HTML/script otomatis ditolak                            | `routes/auth.routes.ts` + test                                              |

### Kerentanan yang SUDAH aman sejak awal (diverifikasi ulang)

| Area                         | Temuan                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| SQL Injection                | ✅ Prisma parameterized; raw query hanya `$queryRaw` tagged-template dengan nilai ter-parameter — tidak ada string concat dari input |
| Harga dari frontend          | ✅ Backend selalu menghitung ulang dari DB; `priceTotal` frontend diabaikan                                                          |
| Payment manipulation         | ✅ Verifikasi ganda: signature lokal + query status ke API Midtrans + cek nominal `payment.amount === gross_amount`                  |
| Duplicate payment/processing | ✅ `WebhookEvent` unique + row-lock `FOR UPDATE` + cek `payment.status === PAID` — idempotent                                        |
| IDOR order                   | ✅ Order milik user lain ditolak; guest wajib `guestToken`                                                                           |
| Privilege escalation         | ✅ `PATCH /auth/me` Zod schema tanpa field role/isActive — diabaikan/ditolak; role divalidasi DB per-request                         |
| SSRF                         | ✅ Tidak ada endpoint yang mengambil URL dari input user; provider URL dari env                                                      |
| Path traversal / file upload | ✅ Tidak ada fitur upload file                                                                                                       |
| API key exposure             | ✅ Semua key di backend `.env`; respons API tidak pernah menyertakan costPrice/serverKey                                             |
| CSRF                         | ✅ Auth via `Authorization: Bearer` header (bukan cookie) — CSRF tidak applicable untuk API; CORS whitelist ketat                    |
| Replay webhook               | ✅ `WebhookEvent` unique per (source, externalId) — duplikat langsung di-skip                                                        |

---

## 2. FILE YANG DIUBAIH/PERBAIKI

| File                                      | Perubahan                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `backend/src/middleware/auth.ts`          | REWRITE: sesi server-side revocable, role dari DB, TTL 2 jam                                                 |
| `backend/src/routes/auth.routes.ts`       | REWRITE: Argon2id, policy password kuat, anti-enumeration, logout revoke, ganti password wajib password lama |
| `backend/src/middleware/optional-auth.ts` | Validasi sesi server-side juga                                                                               |
| `backend/src/index.ts`                    | CSP ketat + HSTS, CORS whitelist ketat, body limit 64kb, trust proxy                                         |
| `backend/src/routes/payment.routes.ts`    | Timing-safe signature compare, Zod shape validation webhook                                                  |
| `backend/prisma/seed.ts`                  | Argon2id hash                                                                                                |
| `backend/tests/helpers.ts`                | Argon2id hash fixtures                                                                                       |
| `backend/tests/security.test.ts`          | BARU: 11 test serangan nyata via HTTP                                                                        |
| `frontend/src/hooks/use-auth.ts`          | Logout memanggil API revoke server-side                                                                      |

**Dependensi**: `bcryptjs` dihapus, `argon2` ditambahkan.

---

## 3. HASIL PENGUJIAN

### Automated (Jest) — semua hijau

- 13 test inti (order, ledger, webhook idempotent, signature Digiflazz, mock provider)
- 11 test keamanan: auth, priv-esc, IDOR, rate limit, webhook forgery ×3, header, stack leak, SQLi, XSS

### Penetrasi live (HTTP nyata ke instance lokal)

| Serangan                                       | Respons                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| SQLi `' ; DROP TABLE Product; --` di search    | `200` — query aman, tabel utuh                                      |
| Webhook signature palsu                        | `400/401` — ditolak                                                 |
| Webhook malformed `{"evil":"<script>"}`        | `400` — ditolak                                                     |
| Admin API dengan token sampah                  | `401`                                                               |
| **Token forged dengan role ADMIN + sid palsu** | `401` — **SUDI TERTOLAK** (validasi sesi server-side)               |
| Brute force login 12×                          | `401 ×6` lalu **`429`** — rate limit aktif pada percobaan ke-7      |
| Header check                                   | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` ✅ |
| Token setelah logout                           | Ditolak `401 SESSION_REVOKED` ✅                                    |

### Yang TIDAK diuji (jujur)

- Refund/chargeback webhook Midtrans sungguhan (butuh kredensial sandbox aktif + transaksi nyata di sandbox)
- SSRF/SSRF-filter runtime (tidak ada permukaan serangannya — tidak ada fetch URL dari input)
- Load/DoS testing

---

## 4. KONFIGURASI PRODUCTION WAJIB

```env
NODE_ENV=production
JWT_SECRET=<random ≥64 chars, simpan di secret manager>
DATABASE_URL="mysql://<user_khusus>:<pass>@<host>/nexora"   # user MySQL dengan privilege SELECT/INSERT/UPDATE/DELETE saja — BUKAN root
FRONTEND_URL=https://domainanda.com                          # CORS hanya origin ini
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=<production key>                          # JANGAN pernah expose ke frontend
```

- MySQL **hanya listen di localhost/private network** — tidak pernah `bind-address 0.0.0.0` publik.
- HTTPS wajib (Let's Encrypt + Nginx reverse proxy); backend tidak pernah diekspos langsung.
- Backup harian `mysqldump --single-transaction` + uji restore berkala.
- Log pino ke file/collector; jangan log `Authorization` header (sudah di-redact).

---

## 5. CHECKLIST SEBELUM PUBLIKASI

- [ ] `JWT_SECRET` diganti dari nilai dev, ≥64 karakter acak
- [ ] Akun seed (`admin@nexora.test`, `demo@nexora.test`) **dihapus atau passwordnya diganti**
- [ ] User MySQL aplikasi bukan root, privilege minimal
- [ ] `MIDTRANS_IS_PRODUCTION=true` + server key production
- [ ] Webhook URL Midtrans menunjuk `https://domain/api/webhooks/midtrans`
- [ ] HTTPS aktif, HTTP redirect ke HTTPS, HSTS terkirim (otomatis saat NODE_ENV=production)
- [ ] `npm test` hijau di staging dengan DB staging
- [ ] `provider SIMULATION` dinonaktifkan di production (tidak ada produk yang memakainya)
- [ ] Smoke test: 1 transaksi end-to-end sandbox, cek WebhookEvent status PROCESSED
- [ ] Rotasi secret: prosedur terdokumentasi (ganti JWT_SECRET → semua sesi hangus = efektif logout massal)

## 6. KETERBATASAN RESIDUAL (transparan)

1. **Midtrans refund API** belum terpasang — refund ke kartu manual via dashboard Midtrans (refund internal ke wallet sudah aman & ter-audit).
2. **No 2FA/admin step-up auth** — direkomendasikan TOTP untuk admin sebelum scale (belum diimplementasi, dicatat sebagai backlog).
3. **Webhook Digiflazz receiver** belum menjadi route — signature verifier sudah ada di adapter.
