# Revisi Format Nominal & Notifikasi Email

## 1. Format Nominal (Pemisah Ribuan)

Semua nominal ditampilkan dalam format Indonesia: `Rp 10.000` (pemisah titik, tanpa desimal).

### Frontend — Input (User Mengetik)

| File | Perubahan |
|---|---|
| `frontend/components/ui/currency-input.tsx` | Komponen baru. Saat user mengetik angka, otomatis diformat dengan pemisah titik (contoh: ketik `10000000` tampil `10.000.000`). Nilai mentah (tanpa format) dikirim ke hidden input untuk backend. |
| `frontend/components/contract-management/contract-form.tsx` | Field "Nilai kontrak" pakai `CurrencyInput` dengan `placeholder="5.000.000"`. |
| `frontend/components/contract-management/contract-operations-sections.tsx` | Form inline (termin, pembayaran, progres) pakai `CurrencyInput`. |
| `frontend/app/(app)/app/payment-terms/new/page.tsx` | Form create termin standalone pakai `CurrencyInput`. |

### Frontend — Display (Menampilkan Angka)

| File | Perubahan |
|---|---|
| `frontend/app/(app)/app/contracts/page.tsx` | Fungsi `formatCurrency()` — daftar kontrak. |
| `frontend/app/(app)/app/payment-terms/page.tsx` | Fungsi `formatCurrency()` — daftar termin. |
| `frontend/app/(app)/app/clients/[clientId]/page.tsx` | Fungsi `formatCurrency()` — detail klien. |
| `frontend/app/(app)/app/contracts/[contractId]/page.tsx` | Fungsi `formatCurrency()` — detail kontrak. |
| `frontend/components/contract-management/contract-operations-sections.tsx` | Fungsi `formatCurrency()` — card termin & pembayaran. |

Semua fungsi `formatCurrency()` menggunakan `Intl.NumberFormat("id-ID")`.

### Backend — Email Notification

| File | Perubahan |
|---|---|
| `backend/app/Notifications/PaymentTermDueNotification.php` | Method `formatCurrency()` — `number_format($amount, 0, ',', '.')` |
| `backend/app/Notifications/PaymentPendingReviewNotification.php` | Method `formatCurrency()` — sama |
| `backend/app/Notifications/PaymentStatusUpdatedNotification.php` | Method `formatCurrency()` — sama |
| `backend/resources/views/emails/payment-term-reminder.blade.php` | `number_format()` inline di Blade |

---

## 2. Notifikasi Email

### File Notifikasi Baru

| File | Fungsi |
|---|---|
| `backend/app/Notifications/PaymentTermDueNotification.php` | Email reminder termin jatuh tempo / overdue. Dikirim otomatis via scheduler harian. |
| `backend/app/Notifications/ContractEndingNotification.php` | Email reminder kontrak mendekati/lewat tanggal selesai. |
| `backend/app/Notifications/PaymentPendingReviewNotification.php` | Email ke tim finance saat klien upload bukti bayar baru. |
| `backend/app/Notifications/PaymentStatusUpdatedNotification.php` | Email ke klien saat status pembayaran berubah (verified/rejected). |
| `backend/app/Notifications/ProjectProgressStaleNotification.php` | Email peringatan progres proyek sudah lama tidak diupdate. |

### File Pendukung

| File | Fungsi |
|---|---|
| `backend/app/Console/Commands/SendDueDateReminders.php` | Command scheduler — kirim reminder termin & kontak setiap hari jam 07.00 WITA. |
| `backend/app/Support/NotificationRecipients.php` | Helper untuk mengumpulkan penerima email (internal + klien). |
| `backend/config/notifications.php` | Konfigurasi: `NOTIFY_INTERNAL_EMAILS` dari `.env`. |
| `backend/resources/views/emails/payment-term-reminder.blade.php` | Template email reminder termin. |
| `backend/resources/views/emails/project-progress-reminder.blade.php` | Template email reminder progres. |
| `backend/app/Mail/PaymentTermReminderMail.php` | Mailable untuk reminder termin (via ReminderController). |
| `backend/app/Mail/ProjectProgressReminderMail.php` | Mailable untuk reminder progres (via ReminderController). |
| `backend/app/Http/Controllers/Api/V1/ReminderController.php` | Endpoint kirim reminder manual dari tombol "Kirim Pengingat" di frontend. |
| `backend/app/Http/Controllers/Api/V1/PaymentController.php` | Trigger notifikasi saat status pembayaran berubah. |
| `backend/app/Http/Controllers/Api/V1/PaymentProofController.php` | Trigger notifikasi saat klien upload bukti bayar. |
