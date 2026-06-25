<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LawyerApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $name;

    /**
     * Create a new message instance.
     */
    public function __construct($name)
    {
        $this->name = $name;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'تهانينا! تم تفعيل حساب المحامي الخاص بك - حكميما',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.lawyer-approved',
        );
    }
}
