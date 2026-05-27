<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentPendingReviewNotification extends Notification
{
    use Queueable;

    public function __construct(public Payment $payment) {}

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

        return (new MailMessage)
            ->subject(sprintf('[Verifikasi] Bukti pembayaran baru — %s', $contract?->contract_number ?? 'Kontrak'))
            ->greeting('Halo Tim Finance,')
            ->line('Bukti pembayaran baru telah diunggah dan menunggu verifikasi.')
            ->line(sprintf('Kontrak: %s — %s', $contract?->contract_number ?? '-', $contract?->contract_title ?? '-'))
            ->line(sprintf('Klien: %s', $contract?->client?->company_name ?? '-'))
            ->line(sprintf('Termin: %s (Termin %s)', $term?->term_title ?? '-', $term?->term_number ?? '-'))
            ->line(sprintf('Tanggal bayar: %s', optional($payment->payment_date)->format('d M Y') ?? '-'))
            ->line(sprintf('Nominal: %s', $this->formatCurrency((float) $payment->amount)))
            ->line(sprintf('Metode: %s', $payment->method ?? '-'))
            ->line('Silakan masuk ke sistem untuk melakukan verifikasi.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return ['payment_id' => $this->payment->id];
    }

    private function formatCurrency(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
