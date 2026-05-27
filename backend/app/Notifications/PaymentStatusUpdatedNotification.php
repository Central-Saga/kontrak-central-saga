<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Payment $payment,
        public string $previousStatus,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payment = $this->payment;
        $term = $payment->paymentTerm;
        $contract = $term?->contract;

        $statusLabel = match ($payment->status) {
            'verified' => 'Terverifikasi',
            'rejected' => 'Ditolak',
            'pending_review' => 'Menunggu verifikasi',
            default => $payment->status,
        };

        $subject = sprintf('[Pembayaran %s] %s', $statusLabel, $contract?->contract_number ?? 'Kontrak');

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Halo,')
            ->line(sprintf('Status pembayaran Anda telah diperbarui menjadi: %s.', $statusLabel))
            ->line(sprintf('Kontrak: %s — %s', $contract?->contract_number ?? '-', $contract?->contract_title ?? '-'))
            ->line(sprintf('Termin: %s (Termin %s)', $term?->term_title ?? '-', $term?->term_number ?? '-'))
            ->line(sprintf('Tanggal bayar: %s', optional($payment->payment_date)->format('d M Y') ?? '-'))
            ->line(sprintf('Nominal: %s', $this->formatCurrency((float) $payment->amount)))
            ->line('Hubungi tim finance jika terdapat pertanyaan terkait status ini.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'payment_id' => $this->payment->id,
            'previous_status' => $this->previousStatus,
            'current_status' => $this->payment->status,
        ];
    }

    private function formatCurrency(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
