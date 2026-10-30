# NEXORA DIGITAL — PANDUAN DEPLOYMENT PRODUCTION

> ⚠️ Deployment production HANYA dilakukan setelah pemilik website menyiapkan
> credential asli (bagian 1) dan menyetujui langkah ini. Tidak ada pembayaran
> production yang diaktifkan sebelum credential merchant tersedia.

---

## 1. CREDENTIAL YANG HARUS DISIAPKAN PEMILIK

| Credential                                                                  | Dari mana                                               | Dipakai untuk                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Domain + akses DNS                                                          | Registrar domain (mis. Cloudflare/Namecheap)            | Arahkan A record ke VPS                                                            |
| VPS (Ubuntu 22.04+, ≥2GB RAM)                                               | DigitalOcean/Vultr/AWS dsb.                             | Backend + MySQL                                                                    |
| SSL                                                                         | Let's Encrypt (gratis, otomatis via certbot)            | HTTPS                                                                              |
| **Midtrans Sandbox** Server/Client Key                                      | dashboard.sandbox.midtrans.com → Settings → Access Keys | Uji pembayaran                                                                     |
| **Midtrans Production** Server/Client Key + akun merchant **terverifikasi** | dashboard.midtrans.com (GoPay Merchant/VT-Direct aktif) | Pembayaran uang asli — QRIS/VA/E-wallet otomatis tersedia sesuai aktivasi merchant |
| **Digiflazz** username + API key (+ activation)                             | member.digiflazz.com → API                              | Auto top-up game; callback URL didaftarkan di dashboard Digiflazz                  |
| **Sosmedmedia** API key + base URL                                          | Panel Sosmedmedia                                       | Layanan SMM                                                                        |
| Email SMTP (opsional)                                                       | mis. Resend/Mailgun                                     | Notifikasi email (saat ini in-app saja)                                            |

---

## 2. TOPOLOGI

```
Browser ──HTTPS──▶ Nginx (:443)
                     ├─ /            → frontend statis (build Vite di /var/www/nexora)
                     └─ /api, /vite  → Node backend (:5000) via systemd
MySQL (:3306)      ── bind 127.0.0.1 saja
Worker             ── systemd service terpisah
```

## 3. LANGKAH DI VPS

```bash
# 1. Dependencies
sudo apt update && sudo apt install -y nginx mysql-server git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs

# 2. MySQL aman
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE nexora CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'nexora'@'localhost' IDENTIFIED BY '<PASSWORD_KUAT>';"
sudo mysql -e "GRANT SELECT,INSERT,UPDATE,DELETE ON nexora.* TO 'nexora'@'localhost';"   # least privilege, tanpa DDL
sudo mysql -e "FLUSH PRIVILEGES;"
# migration dijalankan dengan user admin terpisah, sekali deploy:
# npx prisma migrate deploy   (memakai DATABASE_URL admin sementara)

# 3. Source code
sudo mkdir -p /var/www && sudo chown $USER /var/www
git clone <repo-anda> /var/www/nexora && cd /var/www/nexora

# 4. Backend
cd backend
cp ../.env.production.example .env   # ISI SEMUA NILAI — jangan commit file ini!
npm ci
npx prisma migrate deploy
npm run build
sudo npm i -g pm2
pm2 start ecosystem.config.js
pm2 save && pm2 startup

# 5. Frontend build statis
cd ../frontend
# set VITE_API_URL sama dengan domain publik (lihat .env.production.example)
npm ci && npm run build
sudo cp -r dist/* /var/www/nexora-public/   # document root nginx

# 6. Nginx + SSL
sudo cp deploy/nginx.conf /etc/nginx/sites-available/nexora
sudo ln -s /etc/nginx/sites-available/nexora /etc/nginx/sites-enabled/
sudo certbot --nginx -d domainanda.com -d www.domainanda.com
```

## 4. WEBHOOK URL YANG HARUS DIDAFTARKAN

- **Midtrans** (dashboard → Settings → Payment Notification URL):
  `https://domainanda.com/api/webhooks/midtrans`
- **Digiflazz** (dashboard Digiflazz → kembali URL webhook — BELUM DIIMPLEMENTASIKAN di backend,
  aktifkan setelah route callback dipasang; lihat SECURITY.md residual)

## 5. HEALTH CHECK & MONITORING

- Endpoint: `GET /api/health` → `{"ok":true}` (untuk UptimeRobot/BetterStack)
- Log aplikasi: `pm2 logs` / file via `pm2-logrotate`
- Monitoring sederhana: UptimeRobot ping /api/health tiap 5 menit + alert email

## 6. BACKUP OTOMATIS

```bash
# crontab -e  → backup harian 02:00, simpan 14 hari
0 2 * * * DB_PASSWORD=<password> /var/www/nexora/deploy/backup-db.sh
```

Script ada di `deploy/backup-db.sh` (gzip + rotasi). UJI RESTORE berkala:
`gunzip < backup.sql.gz | mysql -u nexora -p nexora`

## 7. ROTASI SECRET

- Ganti `JWT_SECRET` → semua sesi hangus (efektif force-logout), user login ulang.
- Ganti `MIDTRANS_SERVER_KEY` di Midtrans dashboard + update `.env` + `pm2 restart`.
- Update `.env` → `pm2 restart all` → cek `curl https://domain/api/health`.

## 8. UJI SEBELUM BUKA PUBLIK (checklist 15 skenario)

Jalankan di sandbox (lihat daftar lengkap di `PRODUCTION-READY.md` bagian pengujian).
Minimal: register → login → order → bayar sandbox → webhook masuk → provider kirim →
status SUCCESS → admin dashboard cocok → refund path → akses ilegal ditolak → duplicate terblokir.
