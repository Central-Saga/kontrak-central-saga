# Dokumentasi Menjalankan Email di Kontrak Central Saga

Environment: Windows + WSL Ubuntu + Podman

---

## 1. Prasyarat

Pastikan terinstall di Windows:

- Podman Desktop (atau Podman CLI)
- WSL2 dengan distro Ubuntu
- Git
- Make (opsional, bisa pakai script bawaan)

Verifikasi Podman di PowerShell:

```powershell
podman --version
podman machine start
podman compose version
```

Jika `podman compose version` tidak tersedia, install `podman-compose` via pip:

```bash
pip3 install podman-compose
```

---

## 2. Clone dan Setup Awal

Clone repo ke direktori WSL (bukan Windows path):

```bash
cd ~
git clone https://github.com/Central-Saga/kontrak-central-saga.git
cd kontrak-central-saga
```

Salin environment file:

```bash
cp .env.example .env
```

Edit `.env` root project. Untuk WSL + Podman, gunakan script bawaan `scripts/wsl-nip-dev.sh` yang otomatis mengatur domain dan port. Script ini tidak memerlukan edit hosts file.

---

## 3. Konfigurasi Email

Email dikirim oleh backend Laravel. Ada dua mode:

### Mode A: Log Only (Default, untuk development)

Tidak perlu setup SMTP. Email masuk ke file log container backend.

File `.env` root project:

```
MAIL_MAILER=log
NOTIFY_ENABLED=true
NOTIFY_INTERNAL_EMAILS=emailanda@gmail.com
NOTIFY_PAYMENT_TERM_REMIND_DAYS=7,1
NOTIFY_CONTRACT_ENDING_REMIND_DAYS=30,7,1
```

Email yang dikirim akan muncul di log container:

```bash
podman compose -f docker-compose.dev.yml logs -f backend
```

Atau masuk ke file di dalam container:

```bash
podman compose -f docker-compose.dev.yml exec backend cat storage/logs/laravel.log
```

### Mode B: SMTP Gmail (Production-like)

Jika ingin email benar-benar terkirim ke inbox.

1. Gunakan Gmail dengan App Password (bukan password login biasa).
2. Buat App Password di Google Account -> Security -> 2-Step Verification -> App Passwords.
3. Edit `.env` root project:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ptcentralsagamandala@gmail.com
MAIL_PASSWORD="app-password-anda-di-sini"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=ptcentralsagamandala@gmail.com
MAIL_FROM_NAME="Kontrak Central Saga"
```

**Penting:** Jangan commit file `.env` ke Git. File ini sudah ada di `.gitignore`.

---

## 4. Menjalankan Stack dengan WSL + Podman

Dari Windows PowerShell, jalankan via WSL:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh up
```

Script ini akan:

1. Deteksi IP WSL otomatis
2. Atur domain menggunakan nip.io (contoh: `app.172.23.45.67.nip.io`)
3. Build image frontend dan backend
4. Jalankan container: proxy, frontend, backend, database, scheduler
5. Port yang digunakan: 8080 (HTTP) dan 8443 (HTTPS)

Setelah berjalan, URL akan muncul di terminal. Contoh:

```
Frontend: http://app.172.23.45.67.nip.io:8080
API:      http://api.172.23.45.67.nip.io:8080/api/health
```

**Catatan:** IP WSL bisa berubah setelah restart Windows atau WSL. Jika browser menunjukkan ERR_CONNECTION_REFUSED, jalankan:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh rebuild
```

---

## 5. Verifikasi Scheduler Berjalan

Container `scheduler` menjalankan `php artisan schedule:work`. Ini yang mengirim email reminder otomatis setiap hari pukul 07:00 WITA (Asia/Makassar).

Cek container aktif:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh ps
```

Lihat log scheduler:

```bash
podman compose -f docker-compose.dev.yml logs -f scheduler
```

---

## 6. Menjalankan Email Manual (Testing)

Untuk langsung tes kirim email tanpa menunggu jadwal 07:00:

```powershell
wsl --cd ~/kontrak-central-saga -- bash -c "podman compose -f docker-compose.dev.yml exec -T backend php artisan notifications:send-due-date-reminders"
```

Atau gunakan dry-run untuk melihat siapa saja yang akan dikirimi tanpa benar-benar mengirim:

```bash
podman compose -f docker-compose.dev.yml exec backend php artisan notifications:send-due-date-reminders --dry-run
```

Force kirim ulang (skip throttle harian):

```bash
podman compose -f docker-compose.dev.yml exec backend php artisan notifications:send-due-date-reminders --force
```

---

## 7. Flow Email Notifikasi

Sistem mengirim dua jenis reminder:

1. **Payment Term Due**: Email reminder jatuh tempo pembayaran termin kontrak.
   - Hari pengingat default: H-7 dan H-1 sebelum jatuh tempo.
   - Jika sudah lewat jatuh tempo (overdue), reminder tetap dikirim setiap hari selama status termin masih aktif.

2. **Contract Ending**: Email reminder kontrak akan selesai.
   - Hari pengingat default: H-30, H-7, dan H-1 sebelum tanggal akhir kontrak.
   - Jika sudah lewat tanggal akhir, reminder tetap dikirim selama status kontrak masih aktif atau draft.

Penerima email:

- Email internal (owner/admin/finance) yang terdaftar di `NOTIFY_INTERNAL_EMAILS`
- Email klien yang tercantum di data kontrak

---

## 8. Perintah Berguna

Start stack:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh up
```

Stop stack:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh down
```

Rebuild stack (setelah perubahan IP atau image):

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh rebuild
```

Lihat log semua service:

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh logs
```

Seed database (data awal untuk testing):

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh seed
```

Reset database dan seed ulang (hati-hati, data hilang):

```powershell
wsl --cd ~/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh fresh-seed
```

---

## 9. Troubleshooting

### Port 80 atau 443 sudah dipakai

WSL2 rootless Podman tidak bisa bind port 80/443. Script `wsl-nip-dev.sh` otomatis menggunakan port 8080/8443. Tidak perlu tindakan.

### Podman machine tidak berjalan

```powershell
podman machine init
podman machine start
```

Kemudian buka terminal baru dan jalankan ulang script.

### Backend tidak healthy

Cek log backend:

```bash
podman compose -f docker-compose.dev.yml logs backend
```

Biasanya disebabkan migrasi belum dijalankan. Jalankan:

```bash
podman compose -f docker-compose.dev.yml exec backend php artisan migrate --force
```

### Email tidak terkirim padahal SMTP sudah diatur

1. Cek `NOTIFY_ENABLED=true` di `.env`
2. Cek `NOTIFY_INTERNAL_EMAILS` tidak kosong (wajib ada minimal satu email internal)
3. Cek log backend untuk error SMTP:

```bash
podman compose -f docker-compose.dev.yml logs backend | grep -i mail
```

4. Pastikan App Password Gmail benar, bukan password login biasa.
5. Cek apakah koneksi ke smtp.gmail.com:587 tidak diblok firewall.

### Throttle: email tidak kirim karena sudah dikirim hari ini

Sistem memiliki throttle harian per termin/kontrak. Gunakan `--force` untuk mengirim ulang.

---

## 10. Perbedaan Setup Mac (Docker) vs Windows (WSL+Podman)

| Aspek | Mac (Docker) | Windows (WSL+Podman) |
|-------|-------------|----------------------|
| Perintah start | `make dev-up` | `wsl --cd ... -- bash scripts/wsl-nip-dev.sh up` |
| Domain | `app.kontrak-centralsaga.site` | `app.<WSL-IP>.nip.io` |
| Port | 80/443 (jika tersedia) | 8080/8443 (default) |
| Hosts file | Edit `/etc/hosts` | Tidak perlu (nip.io) |
| TLS/HTTPS | Aktif dengan mkcert | Nonaktif (LOCAL_TLS_ENABLED=false) |
| Compose command | `docker compose` | `podman compose` |

---

## 11. Ringkasan File Konfigurasi Email

File yang perlu diperhatikan:

- `.env` (root project): Variabel email dan notifikasi
- `backend/.env`: Tidak dipakai saat running container (container membaca dari root `.env` via docker-compose)
- `backend/config/mail.php`: Konfigurasi mailer Laravel
- `backend/config/notifications.php`: Toggle enable dan daftar internal emails
- `backend/routes/console.php`: Jadwal scheduler harian
- `docker-compose.dev.yml`: Service backend dan scheduler environment mapping

---

Dokumen ini disusun berdasarkan inspeksi kode project pada tanggal 3 Juni 2026.
