<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PaymentsExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $payments) {}

    public function collection(): Collection
    {
        return $this->payments->map(fn ($payment) => [
            'contract_number' => $payment->paymentTerm?->contract?->contract_number,
            'term_number' => $payment->paymentTerm?->term_number,
            'term_title' => $payment->paymentTerm?->term_title,
            'payment_date' => $payment->payment_date?->format('Y-m-d'),
            'amount' => $payment->amount,
            'method' => $payment->method,
            'status' => $payment->status,
        ]);
    }

    public function headings(): array
    {
        return [
            'Contract Number',
            'Term Number',
            'Term Title',
            'Payment Date',
            'Amount',
            'Method',
            'Status',
        ];
    }
}
