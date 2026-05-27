<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractEndingNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Contract $contract,
        public int $daysUntilEnd,
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
        $contract = $this->contract;
        $clientName = $contract->client?->company_name ?? '-';
        $endDate = optional($contract->end_date)->format('d M Y') ?? '-';

        $isOverdue = $this->daysUntilEnd < 0;
        $isToday = $this->daysUntilEnd === 0;

        $statusLine = match (true) {
            $isOverdue => sprintf('Kontrak sudah lewat %d hari dari tanggal selesai.', abs($this->daysUntilEnd)),
            $isToday => 'Kontrak berakhir hari ini.',
            default => sprintf('Kontrak akan berakhir dalam %d hari.', $this->daysUntilEnd),
        };

        $subject = $isOverdue
            ? sprintf('[Overdue] Kontrak %s sudah lewat', $contract->contract_number)
            : sprintf('[Reminder] Kontrak %s berakhir H-%d', $contract->contract_number, max($this->daysUntilEnd, 0));

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Halo,')
            ->line($statusLine)
            ->line(sprintf('Kontrak: %s — %s', $contract->contract_number, $contract->contract_title))
            ->line(sprintf('Klien: %s', $clientName))
            ->line(sprintf('Proyek: %s', $contract->project_name))
            ->line(sprintf('Tanggal selesai: %s', $endDate))
            ->line('Mohon konfirmasi status penyelesaian atau perpanjangan kontrak.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'contract_id' => $this->contract->id,
            'days_until_end' => $this->daysUntilEnd,
        ];
    }
}
