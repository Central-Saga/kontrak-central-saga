<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PermissionsExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $permissions) {}

    public function collection(): Collection
    {
        return $this->permissions->map(fn ($permission) => [
            'name' => $permission->name,
            'roles' => $permission->roles->pluck('name')->implode(', '),
            'roles_count' => (int) $permission->roles_count,
            'created_at' => $permission->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    public function headings(): array
    {
        return [
            'Hak Akses',
            'Peran Terkait',
            'Jumlah Peran',
            'Dibuat Pada',
        ];
    }
}
