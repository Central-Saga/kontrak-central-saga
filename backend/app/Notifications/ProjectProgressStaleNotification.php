<?php

namespace App\Notifications;

use App\Models\ProjectProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectProgressStaleNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ProjectProgress $progress,
        public int $daysSinceUpdate,
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
        $progress = $this->progress;
        $contract = $progress->contract;
        $clientName = $contract?->client?->company_name ?? '-';
        $contractNumber = $contract?->contract_number ?? '-';
        $contractTitle = $contract?->contract_title ?? '-';
        $progressDate = optional($progress->progress_date)->format('d M Y') ?? '-';

        $subject = sprintf(
            '[Stale] Progres proyek %s — %s (%d hari tanpa update)',
            $progress->progress_title,
            $contractNumber,
            $this->daysSinceUpdate,
        );

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Halo,')
            ->line(sprintf(
                'Progres proyek berikut sudah tidak di-update selama %d hari.',
                $this->daysSinceUpdate,
            ))
            ->line(sprintf('Kontrak: %s — %s', $contractNumber, $contractTitle))
            ->line(sprintf('Klien: %s', $clientName))
            ->line(sprintf('Judul progres: %s', $progress->progress_title))
            ->line(sprintf('Tanggal laporan terakhir: %s', $progressDate))
            ->line(sprintf('Persentase terakhir: %d%%', $progress->percentage))
            ->line(sprintf('Status: %s', str_replace('_', ' ', ucfirst($progress->status))))
            ->line('Mohon perbarui progres proyek atau konfirmasi status terkini kepada klien.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'project_progress_id' => $this->progress->id,
            'days_since_update' => $this->daysSinceUpdate,
        ];
    }
}
