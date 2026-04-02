<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RolesExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $roles) {}

    public function collection(): Collection
    {
        return $this->roles->map(fn ($role) => [
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->implode(', '),
            'permissions_count' => (int) $role->permissions_count,
            'users_count' => (int) $role->users_count,
            'created_at' => $role->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    public function headings(): array
    {
        return [
            'Nama Peran',
            'Hak Akses',
            'Jumlah Hak Akses',
            'Jumlah Pengguna',
            'Dibuat Pada',
        ];
    }
}
