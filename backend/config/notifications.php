<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Notification toggle
    |--------------------------------------------------------------------------
    |
    | Set NOTIFY_ENABLED=false untuk mematikan seluruh email notifikasi
    | (berguna saat development atau saat SMTP belum dikonfigurasi).
    |
    */

    'enabled' => env('NOTIFY_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Internal recipients
    |--------------------------------------------------------------------------
    |
    | Daftar email internal (Owner / Admin / Finance) yang selalu menerima
    | notifikasi operasional. Pisahkan dengan koma di .env.
    |
    */

    'internal_emails' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('NOTIFY_INTERNAL_EMAILS', '')),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Reminder windows (in days)
    |--------------------------------------------------------------------------
    |
    | Pada hari berapa sebelum jatuh tempo email reminder dikirim.
    | Reminder overdue (lewat jatuh tempo) selalu dikirim selama termin/kontrak
    | masih dalam status aktif.
    |
    */

    'payment_term_remind_days' => array_values(array_filter(array_map(
        fn (string $value): int => (int) trim($value),
        explode(',', (string) env('NOTIFY_PAYMENT_TERM_REMIND_DAYS', '7,1')),
    ))),

    'contract_ending_remind_days' => array_values(array_filter(array_map(
        fn (string $value): int => (int) trim($value),
        explode(',', (string) env('NOTIFY_CONTRACT_ENDING_REMIND_DAYS', '30,7,1')),
    ))),

];
