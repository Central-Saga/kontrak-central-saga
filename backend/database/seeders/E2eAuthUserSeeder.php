<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eAuthUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'e2e.user@example.com'],
            [
                'name' => 'E2E User',
                'password' => Hash::make('Password123!'),
            ],
        );
    }
}
