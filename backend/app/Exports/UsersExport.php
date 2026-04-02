<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class UsersExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $users) {}

    public function collection(): Collection
    {
        return $this->users->map(fn ($user) => [
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->implode(', '),
            'roles_count' => (int) $user->roles_count,
            'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    public function headings(): array
    {
        return [
            'Nama',
            'Username',
            'Email',
            'Peran',
            'Jumlah Peran',
            'Dibuat Pada',
        ];
    }
}
