<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class MinimalAdminSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $modules = [
            'users',
            'roles',
            'permissions',
            'clients',
            'contracts',
            'payment_terms',
            'payments',
            'payment_proofs',
            'project_progress',
        ];

        $permissionActions = ['create', 'read', 'update', 'delete', 'export', 'verification'];

        $modulePermissions = collect($modules)
            ->flatMap(fn (string $module): array => collect($permissionActions)
                ->map(fn (string $action): string => sprintf('%s %s', $action, str_replace('_', ' ', $module)))
                ->all())
            ->all();

        $legacyPermissions = [
            'manage clients',
            'manage contracts',
            'manage payment terms',
            'manage payments',
            'upload payment proofs',
            'manage project progress',
            'view reporting dashboard',
            'view activity logs',
            'export reports',
            'access client portal',
        ];

        $permissions = collect([...$modulePermissions, ...$legacyPermissions])
            ->unique()
            ->values()
            ->mapWithKeys(fn (string $name): array => [
                $name => Permission::findOrCreate($name, 'web'),
            ]);

        $adminRole = Role::findOrCreate('admin', 'web');
        $adminRole->syncPermissions($permissions->values());

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@centralsaga.test'],
            ['name' => 'Central Saga Admin', 'password' => 'password'],
        );

        $admin->syncRoles([$adminRole]);
        $admin->givePermissionTo($permissions->values());
    }
}
