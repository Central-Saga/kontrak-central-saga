<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url');
        $resetUrl = sprintf('%s/reset-password?token=%s&email=%s', $frontendUrl, $this->token, urlencode($notifiable->email));

        return (new MailMessage)
            ->subject('Reset password Kontrak Central Saga')
            ->greeting('Halo, '.$notifiable->name)
            ->line('Kami menerima permintaan reset password untuk akun Anda.')
            ->action('Reset password', $resetUrl)
            ->line('Jika Anda tidak meminta reset password, abaikan email ini.')
            ->salutation('Salam, Tim Kontrak Central Saga');
    }
}
