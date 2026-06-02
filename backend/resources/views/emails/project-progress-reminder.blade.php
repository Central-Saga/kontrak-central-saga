<x-mail::message>
# Pengingat Progres Proyek

Halo,

Kami mengingatkan tentang progres proyek dari kontrak **{{ $contract->contract_number }} — {{ $contract->contract_title }}**.

**Detail progres:**
- Judul Progres: {{ $progress->progress_title }}
- Tanggal Laporan: {{ \Carbon\Carbon::parse($progress->progress_date)->translatedFormat('d F Y') }}
- Persentase: {{ $progress->percentage }}%
- Status: {{ ucfirst(str_replace('_', ' ', $progress->status)) }}

@if($progress->milestone_reference)
**Referensi Milestone:** {{ $progress->milestone_reference }}
@endif

@if($progress->progress_description)
**Deskripsi:**
{{ $progress->progress_description }}
@endif

@if($progress->notes)
**Catatan:**
{{ $progress->notes }}
@endif

Mohon segera lakukan tindak lanjut sesuai prosedur.

Regards,<br>
{{ config('app.name') }}
</x-mail::message>
