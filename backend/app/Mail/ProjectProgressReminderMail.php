<?php

namespace App\Mail;

use App\Models\ProjectProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectProgressReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ProjectProgress $progress) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengingat Progres Proyek: '.$this->progress->progress_title,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.project-progress-reminder',
            with: [
                'progress' => $this->progress,
                'contract' => $this->progress->contract,
            ],
        );
    }
}
