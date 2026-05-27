<?php

namespace App\Support;

use Illuminate\Notifications\AnonymousNotifiable;

class NotificationRecipients
{
    /**
     * Build an AnonymousNotifiable seeded with the configured internal emails.
     * Returns null when no internal recipients are configured so callers can skip silently.
     */
    public static function internal(): ?AnonymousNotifiable
    {
        if (! config('notifications.enabled', true)) {
            return null;
        }

        $emails = collect(config('notifications.internal_emails', []))
            ->filter()
            ->values()
            ->all();

        if (empty($emails)) {
            return null;
        }

        $notifiable = new AnonymousNotifiable;

        foreach ($emails as $email) {
            $notifiable->route('mail', $email);
        }

        return $notifiable;
    }

    public static function forEmail(?string $email): ?AnonymousNotifiable
    {
        if (! config('notifications.enabled', true)) {
            return null;
        }

        $email = trim((string) $email);

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return (new AnonymousNotifiable)->route('mail', $email);
    }
}
