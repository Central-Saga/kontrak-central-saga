<x-mail::message>
# Pengingat Pembayaran Termin

Halo,

Kami mengingatkan bahwa **Termin {{ $paymentTerm->term_number }} — {{ $paymentTerm->term_title }}** dari kontrak **{{ $contract->contract_number }} — {{ $contract->contract_title }}** akan jatuh tempo.

**Detail termin:**
- Nomor Termin: {{ $paymentTerm->term_number }}
- Judul: {{ $paymentTerm->term_title }}
- Tanggal Jatuh Tempo: {{ \Carbon\Carbon::parse($paymentTerm->due_date)->translatedFormat('d F Y') }}
- Nilai: Rp {{ number_format((float) $paymentTerm->amount, 0, ',', '.') }}
- Status: {{ ucfirst(str_replace('_', ' ', $paymentTerm->status)) }}

@if($paymentTerm->payable_after_condition)
**Syarat bayar:** {{ $paymentTerm->payable_after_condition }}
@endif

Mohon segera lakukan tindak lanjut sesuai prosedur.

Regards,<br>
{{ config('app.name') }}
</x-mail::message>
