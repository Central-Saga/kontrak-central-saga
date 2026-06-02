<?php

namespace App\Mail;

use App\Models\PaymentTerm;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentTermReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public PaymentTerm $paymentTerm) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengingat Pembayaran Termin: '.$this->paymentTerm->term_title,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment-term-reminder',
            with: [
                'paymentTerm' => $this->paymentTerm,
                'contract' => $this->paymentTerm->contract,
            ],
        );
    }
}
