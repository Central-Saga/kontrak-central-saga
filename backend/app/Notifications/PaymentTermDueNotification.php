<?php

namespace App\Notifications;

use App\Models\PaymentTerm;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentTermDueNotification extends Notification
{
    use Queueable;

    public function __construct(
        public PaymentTerm $paymentTerm,
        public int $daysUntilDue,
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
        $term = $this->paymentTerm;
        $contract = $term->contract;
        $clientName = $contract?->client?->company_name ?? '-';
        $contractNumber = $contract?->contract_number ?? '-';
        $contractTitle = $contract?->contract_title ?? '-';
        $amount = $this->formatCurrency((float) $term->amount);
        $dueDate = optional($term->due_date)->format('d M Y') ?? '-';

        $isOverdue = $this->daysUntilDue < 0;
        $isToday = $this->daysUntilDue === 0;

        $statusLine = match (true) {
            $isOverdue => sprintf('Termin sudah lewat %d hari dari jatuh tempo.', abs($this->daysUntilDue)),
            $isToday => 'Termin jatuh tempo hari ini.',
            default => sprintf('Termin akan jatuh tempo dalam %d hari.', $this->daysUntilDue),
        };

        $subject = $isOverdue
            ? sprintf('[Overdue] Termin %s — %s', $term->term_title, $contractNumber)
            : sprintf('[Reminder] Termin %s — %s (H-%d)', $term->term_title, $contractNumber, max($this->daysUntilDue, 0));

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Halo,')
            ->line($statusLine)
            ->line(sprintf('Kontrak: %s — %s', $contractNumber, $contractTitle))
            ->line(sprintf('Klien: %s', $clientName))
            ->line(sprintf('Termin: %s (Termin %d)', $term->term_title, $term->term_number))
            ->line(sprintf('Jatuh tempo: %s', $dueDate))
            ->line(sprintf('Nominal: %s', $amount))
            ->line('Mohon segera lakukan tindak lanjut sesuai prosedur.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'payment_term_id' => $this->paymentTerm->id,
            'days_until_due' => $this->daysUntilDue,
        ];
    }

    private function formatCurrency(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
