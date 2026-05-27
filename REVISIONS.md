# REVISIONS - Kontrak Central Saga

Catatan revisi sistem kontrak PT Central Saga Mandala. Disusun untuk membantu sidang/bimbingan dan onboarding tim.

## Daftar revisi

1. Format ribuan otomatis pada nilai uang
2. Notifikasi email jatuh tempo dan status pembayaran
3. Throttle harian agar tidak ada email duplikat
4. Klarifikasi makna Status klien vs Akses portal
5. Validasi konsistensi status klien dan portal
6. Breakdown indikator pada halaman detail klien
7. Progress bar visual dinamis pada laporan progres proyek

---

## 1. Format ribuan otomatis pada nilai uang

**Masalah**: Field nilai kontrak dan nominal pembayaran menerima angka mentah (`5000000`) sehingga sulit dibaca dan rawan typo nominal besar.

**Solusi**: Komponen `CurrencyInput` baru di `frontend/components/ui/currency-input.tsx`. Saat user mengetik, sistem otomatis menambahkan pemisah ribuan gaya Indonesia (`5.000.000`). Hidden input mengirim nilai mentah ke backend sehingga tidak ada perubahan kontrak API.

**Cakupan**:
- Form kontrak (nilai kontrak)
- Form termin pembayaran (standalone dan inline)
- Form pembayaran (nominal bayar)

**File terdampak**:
- `frontend/components/ui/currency-input.tsx` (baru)
- `frontend/components/contract-management/contract-form.tsx`
- `frontend/components/contract-management/contract-operations-sections.tsx`
- frontend/app/(app)/app/payment-terms/new/page.tsx

## 2. Notifikasi email jatuh tempo dan status pembayaran

Sistem mengirim email pada empat kejadian:

- Termin pembayaran mendekati atau lewat jatuh tempo
- Kontrak mendekati atau lewat tanggal selesai
- Klien mengunggah bukti pembayaran (status pending review)
- Pembayaran diverifikasi atau ditolak

**Penerima**:
- Internal: daftar email pada NOTIFY_INTERNAL_EMAILS
- Klien: email pada data klien yang terhubung ke kontrak

**Konfigurasi env utama**:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
NOTIFY_INTERNAL_EMAILS=
NOTIFY_PAYMENT_TERM_REMIND_DAYS=7,1
NOTIFY_CONTRACT_ENDING_REMIND_DAYS=30,7,1
NOTIFY_ENABLED=true
```

**Schedule**: Command notifications:send-due-date-reminders dijalankan otomatis setiap hari pukul 07.00 WITA melalui Laravel Scheduler.

**File terdampak**:
- backend/config/notifications.php (baru)
- backend/app/Notifications/PaymentTermDueNotification.php (baru)
- backend/app/Notifications/ContractEndingNotification.php (baru)
- backend/app/Notifications/PaymentPendingReviewNotification.php (baru)
- backend/app/Notifications/PaymentStatusUpdatedNotification.php (baru)
- backend/app/Support/NotificationRecipients.php (baru)
- backend/app/Console/Commands/SendDueDateReminders.php (baru)
- backend/routes/console.php (schedule)
- backend/app/Http/Controllers/Api/V1/PaymentController.php
- backend/app/Http/Controllers/Api/V1/PaymentProofController.php

## 3. Throttle harian agar tidak ada email duplikat

Command notifications:send-due-date-reminders menyimpan tanda di cache untuk setiap entitas (termin atau kontrak) per tanggal. Sekali terkirim, panggilan berikutnya pada hari yang sama dilewati dan dihitung sebagai skipped. Cache key berformat notifications:reminder:entity:id:tanggal dengan TTL 24 jam.

Flag baru:
- --dry-run untuk melihat kandidat tanpa kirim email
- --force untuk bypass throttle (debug atau pengujian ulang)

## 4. Klarifikasi makna Status klien vs Akses portal

**Sebelumnya**: Hanya ada keterangan singkat sehingga sering ditafsirkan keliru. Misalnya jawaban kepada dosen yang menyebut status klien aktif berarti masih terikat kontrak.

**Sekarang**: Form klien menjelaskan secara eksplisit:

- Status klien hanya menandai data klien aktif atau diarsipkan pada daftar utama
- Akses portal mengontrol akun login self-service klien
- Status kontrak dikelola tersendiri pada masing-masing kontrak

### Matriks resmi Status klien dan Akses portal

| Status klien | Akses portal | Arti bisnis |
|---|---|---|
| Aktif | Aktif | Klien aktif yang menggunakan portal untuk self-service (lihat kontrak, upload bukti pembayaran) |
| Aktif | Tidak aktif | Klien aktif tetapi dilayani langsung tim internal melalui WA, email, atau telepon |
| Tidak aktif | Tidak aktif | Klien arsip yang tidak dilayani lagi, hanya disimpan untuk histori |
| Tidak aktif | Aktif | Tidak diperbolehkan oleh sistem (otomatis dikoreksi) |

**File terdampak**:
- frontend/components/client-management/client-form.tsx

## 5. Validasi konsistensi status klien dan portal

**Aturan**:
- Saat status klien dipilih Tidak aktif, checkbox akses portal otomatis dimatikan dan dikunci di front-end
- Backend tetap memvalidasi: payload yang mengaktifkan portal sambil status inactive akan ditolak dengan pesan jelas
- Saat status diubah ke inactive lewat update, controller memaksa portal_access_enabled menjadi false sebelum simpan

**Skenario pengujian**:
- Buat klien baru dengan status Tidak aktif dan portal Aktif: ditolak validator
- Edit klien aktif dengan portal aktif menjadi status Tidak aktif: portal otomatis dimatikan, akun user terkait dinonaktifkan
- Aktifkan kembali status menjadi Aktif: portal tetap nonaktif sampai admin centang manual

**File terdampak**:
- backend/app/Http/Requests/StoreClientRequest.php
- backend/app/Http/Requests/UpdateClientRequest.php
- backend/app/Http/Controllers/Api/V1/ClientController.php
- frontend/components/client-management/client-form.tsx

## 6. Breakdown indikator pada halaman detail klien

Halaman detail klien sekarang menampilkan tiga kartu indikator independen di bagian atas:

- Status data klien dengan penjelasan apakah klien aktif atau diarsipkan
- Akses portal dengan penjelasan apakah klien punya akun login self-service
- Kontrak terhubung dengan total kontrak serta breakdown jumlah aktif, selesai, dan lainnya

Tujuannya: dosen dan tim internal langsung paham bahwa ketiga indikator tersebut tidak saling tergantung.

**File terdampak**:
- frontend/app/(app)/app/clients/[clientId]/page.tsx

## 7. Progress bar visual dinamis pada laporan progres proyek

**Sebelumnya**: Persentase progres ditampilkan sebagai teks Progress 50% saja, tanpa visualisasi.

**Sekarang**: Komponen ProgressBar baru menampilkan bilah progres dengan warna mengikuti status:

- Belum mulai: abu-abu
- Berjalan: warna primer
- Tertahan: kuning
- Terlambat: merah
- Selesai: hijau (otomatis ketika persentase mencapai 100)

Bilah memakai animasi transisi lebar agar perubahan persentase terlihat halus. Setiap bilah punya atribut role progressbar dan aria-valuenow untuk dukungan pembaca layar.

Pemakaian:
- Setiap kartu progres pada halaman detail kontrak
- Kartu Visualisasi progres terbaru pada Ringkasan operasional kontrak

**File terdampak**:
- frontend/components/ui/progress-bar.tsx (baru)
- frontend/components/contract-management/contract-operations-sections.tsx
- frontend/app/(app)/app/contracts/[contractId]/page.tsx

## Catatan untuk bimbingan

Saat ditanya tentang Status klien dan Akses portal, gunakan kalimat berikut sebagai jawaban resmi:

Status klien menandai apakah data klien masih aktif di daftar utama atau sudah diarsipkan. Akses portal mengontrol akun login klien untuk self-service. Status kontrak dikelola tersendiri pada masing-masing kontrak. Ketiganya independen dan ditampilkan terpisah pada halaman detail klien.



