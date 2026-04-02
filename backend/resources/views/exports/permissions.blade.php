<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; margin: 28px; }
        .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 14px; }
        .company { font-size: 14px; font-weight: 700; color: #1e3a8a; margin: 0; }
        .app { font-size: 12px; color: #334155; margin: 2px 0 0; }
        .title { font-size: 18px; font-weight: 700; margin: 16px 0 4px; color: #0f172a; }
        .meta { margin: 0; color: #475569; font-size: 10px; }
        .filters { margin-top: 10px; padding: 8px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; }
        .filters-title { font-size: 10px; font-weight: 700; color: #1e293b; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .4px; }
        .filters p { margin: 2px 0; color: #334155; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; }
        th { background: #e2e8f0; color: #0f172a; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
        td { font-size: 10px; }
        .muted { color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <p class="company">PT Central Saga Mandala</p>
        <p class="app">Sistem Kontrak Central Saga</p>
    </div>

    <h1 class="title">{{ $title }}</h1>
    <p class="meta">Waktu cetak: {{ $generatedAt->format('d M Y H:i:s') }} WIB</p>
    <p class="meta">Total data: {{ $records->count() }} hak akses</p>

    <div class="filters">
        <p class="filters-title">Ringkasan Filter</p>
        <p><strong>Pencarian:</strong> {{ $filters['search'] ?? '-' }}</p>
        <p><strong>Aksi:</strong> {{ $filters['action'] ?? '-' }}</p>
        <p><strong>Modul:</strong> {{ $filters['module'] ?? '-' }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Hak Akses</th>
                <th>Peran Terkait</th>
                <th>Jumlah Peran</th>
                <th>Dibuat Pada</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($records as $permission)
                <tr>
                    <td>{{ $permission->name }}</td>
                    <td>{{ $permission->roles->pluck('name')->implode(', ') ?: '-' }}</td>
                    <td>{{ (int) $permission->roles_count }}</td>
                    <td class="muted">{{ optional($permission->created_at)->format('d-m-Y H:i') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="muted">Tidak ada data hak akses sesuai filter.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
