<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ModuleStarterSeeder extends Seeder
{
    public const PRIMARY_ROLE_NAME = 'admin';

    public const PRIMARY_USER_EMAIL = 'admin@centralsaga.test';

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

        $permissions = collect([...$modulePermissions, ...$legacyPermissions])->unique()->values()->mapWithKeys(fn (string $name): array => [
            $name => Permission::findOrCreate($name, 'web'),
        ]);

        $adminRole = Role::findOrCreate(self::PRIMARY_ROLE_NAME, 'web');
        $financeRole = Role::findOrCreate('finance', 'web');
        $projectManagerRole = Role::findOrCreate('project-manager', 'web');
        $clientRole = Role::findOrCreate('client', 'web');

        $adminRole->syncPermissions($permissions->values());
        $financeRole->syncPermissions([
            $permissions['read contracts'],
            $permissions['read payment terms'],
            $permissions['create payment terms'],
            $permissions['update payment terms'],
            $permissions['delete payment terms'],
            $permissions['read payment proofs'],
            $permissions['verification payment proofs'],
            $permissions['manage payment terms'],
            $permissions['manage payments'],
            $permissions['view reporting dashboard'],
            $permissions['export reports'],
            $permissions['read payments'],
            $permissions['create payments'],
            $permissions['update payments'],
            $permissions['delete payments'],
            $permissions['verification payments'],
            $permissions['export payment terms'],
            $permissions['export payments'],
        ]);
        $projectManagerRole->syncPermissions([
            $permissions['read contracts'],
            $permissions['read payment terms'],
            $permissions['read payments'],
            $permissions['read payment proofs'],
            $permissions['create payment proofs'],
            $permissions['upload payment proofs'],
            $permissions['read project progress'],
            $permissions['create project progress'],
            $permissions['update project progress'],
        ]);
        $clientRole->syncPermissions([
            $permissions['read contracts'],
            $permissions['read payment terms'],
            $permissions['read payments'],
            $permissions['read payment proofs'],
            $permissions['create payment proofs'],
            $permissions['read project progress'],
            $permissions['upload payment proofs'],
            $permissions['access client portal'],
        ]);

        $admin = User::query()->updateOrCreate(
            ['email' => self::PRIMARY_USER_EMAIL],
            ['name' => 'Central Saga Admin', 'password' => 'password'],
        );
        $finance = User::query()->updateOrCreate(
            ['email' => 'finance@centralsaga.test'],
            ['name' => 'Central Saga Finance', 'password' => 'password'],
        );
        $projectManager = User::query()->updateOrCreate(
            ['email' => 'pm@centralsaga.test'],
            ['name' => 'Central Saga PM', 'password' => 'password'],
        );
        $clientUser = User::query()->updateOrCreate(
            ['email' => 'client@centralsaga.test'],
            ['name' => 'Central Saga Client', 'password' => 'password'],
        );

        $admin->syncRoles([$adminRole]);
        $finance->syncRoles([$financeRole]);
        $projectManager->syncRoles([$projectManagerRole]);
        $clientUser->syncRoles([$clientRole]);

        $admin->givePermissionTo([
            $permissions['create users'],
            $permissions['read users'],
            $permissions['update users'],
            $permissions['delete users'],
            $permissions['export users'],
            $permissions['verification users'],
            $permissions['create roles'],
            $permissions['read roles'],
            $permissions['update roles'],
            $permissions['delete roles'],
            $permissions['export roles'],
            $permissions['verification roles'],
            $permissions['create permissions'],
            $permissions['read permissions'],
            $permissions['update permissions'],
            $permissions['delete permissions'],
            $permissions['export permissions'],
            $permissions['verification permissions'],
        ]);

        $clients = collect([
            [
                'client_code' => 'CL-001',
                'company_name' => 'PT Nusantara Arsitek',
                'contact_person' => 'Rina Kurnia',
                'email' => 'rina@nusantara-arsitek.test',
                'phone' => '0812-1000-0001',
                'address' => 'Denpasar, Bali',
                'status' => 'active',
                'portal_access_enabled' => true,
                'user_id' => $clientUser->id,
            ],
            [
                'client_code' => 'CL-002',
                'company_name' => 'PT Lintas Data Prima',
                'contact_person' => 'Aditya Saputra',
                'email' => 'aditya@lintas-data.test',
                'phone' => '0812-1000-0002',
                'address' => 'Jakarta Selatan',
                'status' => 'active',
                'portal_access_enabled' => true,
                'user_id' => null,
            ],
            [
                'client_code' => 'CL-003',
                'company_name' => 'CV Pilar Mandiri',
                'contact_person' => 'Dewi Laras',
                'email' => 'dewi@pilar-mandiri.test',
                'phone' => '0812-1000-0003',
                'address' => 'Surabaya, Jawa Timur',
                'status' => 'inactive',
                'portal_access_enabled' => false,
                'user_id' => null,
            ],
        ])->mapWithKeys(fn (array $attributes): array => [
            $attributes['client_code'] => Client::updateOrCreate(
                ['client_code' => $attributes['client_code']],
                $attributes,
            ),
        ]);

        $contracts = collect([
            [
                'contract_number' => 'KCS-2026-001',
                'client_code' => 'CL-001',
                'contract_title' => 'Implementasi portal kontrak fase 1',
                'project_name' => 'Portal Kontrak Fase 1',
                'contract_date' => '2026-01-10',
                'start_date' => '2026-01-15',
                'end_date' => '2026-05-30',
                'contract_value' => 450000000,
                'project_scope' => 'Pengembangan modul kontrak, termin pembayaran, dan dashboard awal.',
                'payment_scheme_summary' => '40%-30%-30%',
                'contract_status' => 'active',
                'notes' => 'Kontrak aktif dengan progres stabil.',
            ],
            [
                'contract_number' => 'KCS-2026-002',
                'client_code' => 'CL-002',
                'contract_title' => 'Integrasi validasi pembayaran',
                'project_name' => 'Integrasi Validasi Pembayaran',
                'contract_date' => '2026-02-01',
                'start_date' => '2026-02-05',
                'end_date' => '2026-06-30',
                'contract_value' => 320000000,
                'project_scope' => 'Pembuatan alur unggah bukti bayar, validasi finance, dan notifikasi status.',
                'payment_scheme_summary' => '50%-50%',
                'contract_status' => 'active',
                'notes' => 'Masuk tahap pengembangan modul pembayaran.',
            ],
            [
                'contract_number' => 'KCS-2026-003',
                'client_code' => 'CL-003',
                'contract_title' => 'Dashboard manajemen dan laporan',
                'project_name' => 'Dashboard Manajemen',
                'contract_date' => '2025-10-15',
                'start_date' => '2025-10-20',
                'end_date' => '2026-01-20',
                'contract_value' => 180000000,
                'project_scope' => 'Pelaporan kontrak, overdue, dan ringkasan progres untuk manajemen.',
                'payment_scheme_summary' => '30%-40%-30%',
                'contract_status' => 'completed',
                'notes' => 'Project selesai dan menjadi referensi laporan.',
            ],
        ])->mapWithKeys(function (array $attributes) use ($clients, $admin, $projectManager): array {
            $operationalOwner = in_array($attributes['contract_number'], ['KCS-2026-001', 'KCS-2026-002'], true)
                ? $projectManager
                : $admin;

            $contract = Contract::updateOrCreate(
                ['contract_number' => $attributes['contract_number']],
                [
                    'client_id' => $clients[$attributes['client_code']]->id,
                    'contract_title' => $attributes['contract_title'],
                    'project_name' => $attributes['project_name'],
                    'contract_date' => $attributes['contract_date'],
                    'start_date' => $attributes['start_date'],
                    'end_date' => $attributes['end_date'],
                    'contract_value' => $attributes['contract_value'],
                    'project_scope' => $attributes['project_scope'],
                    'payment_scheme_summary' => $attributes['payment_scheme_summary'],
                    'contract_status' => $attributes['contract_status'],
                    'notes' => $attributes['notes'],
                    'created_by' => $admin->id,
                    'updated_by' => $operationalOwner->id,
                ],
            );

            return [$attributes['contract_number'] => $contract];
        });

        $paymentTerms = [
            ['contract' => 'KCS-2026-001', 'term_number' => 1, 'term_title' => 'Termin awal', 'due_date' => '2026-01-20', 'amount' => 180000000, 'status' => 'paid'],
            ['contract' => 'KCS-2026-001', 'term_number' => 2, 'term_title' => 'Termin tengah', 'due_date' => '2026-03-15', 'amount' => 135000000, 'status' => 'upcoming'],
            ['contract' => 'KCS-2026-001', 'term_number' => 3, 'term_title' => 'Termin akhir', 'due_date' => '2026-05-25', 'amount' => 135000000, 'status' => 'pending'],
            ['contract' => 'KCS-2026-002', 'term_number' => 1, 'term_title' => 'Termin implementasi', 'due_date' => '2026-02-15', 'amount' => 160000000, 'status' => 'paid'],
            ['contract' => 'KCS-2026-002', 'term_number' => 2, 'term_title' => 'Termin final', 'due_date' => '2026-04-15', 'amount' => 160000000, 'status' => 'overdue'],
            ['contract' => 'KCS-2026-003', 'term_number' => 1, 'term_title' => 'Termin dashboard awal', 'due_date' => '2025-11-01', 'amount' => 54000000, 'status' => 'paid'],
            ['contract' => 'KCS-2026-003', 'term_number' => 2, 'term_title' => 'Termin pelaporan', 'due_date' => '2025-12-01', 'amount' => 72000000, 'status' => 'paid'],
            ['contract' => 'KCS-2026-003', 'term_number' => 3, 'term_title' => 'Termin finalisasi', 'due_date' => '2026-01-15', 'amount' => 54000000, 'status' => 'paid'],
        ];

        foreach ($paymentTerms as $paymentTerm) {
            PaymentTerm::updateOrCreate(
                [
                    'contract_id' => $contracts[$paymentTerm['contract']]->id,
                    'term_number' => $paymentTerm['term_number'],
                ],
                [
                    'term_title' => $paymentTerm['term_title'],
                    'due_date' => $paymentTerm['due_date'],
                    'amount' => $paymentTerm['amount'],
                    'description' => 'Starter data untuk pengujian API pembayaran.',
                    'status' => $paymentTerm['status'],
                    'payable_after_condition' => 'Sesuai milestone kontrak',
                    'created_by' => $finance->id,
                    'updated_by' => $finance->id,
                ],
            );
        }

        $payments = [
            ['contract' => 'KCS-2026-001', 'term_number' => 1, 'payment_date' => '2026-01-20', 'amount' => 180000000, 'method' => 'transfer', 'status' => 'verified'],
            ['contract' => 'KCS-2026-002', 'term_number' => 1, 'payment_date' => '2026-02-16', 'amount' => 160000000, 'method' => 'virtual_account', 'status' => 'verified'],
            ['contract' => 'KCS-2026-002', 'term_number' => 2, 'payment_date' => '2026-04-18', 'amount' => 160000000, 'method' => 'transfer', 'status' => 'pending_review'],
            ['contract' => 'KCS-2026-003', 'term_number' => 1, 'payment_date' => '2025-11-02', 'amount' => 54000000, 'method' => 'transfer', 'status' => 'verified'],
            ['contract' => 'KCS-2026-003', 'term_number' => 2, 'payment_date' => '2025-12-05', 'amount' => 72000000, 'method' => 'giro', 'status' => 'verified'],
            ['contract' => 'KCS-2026-003', 'term_number' => 3, 'payment_date' => '2026-01-16', 'amount' => 54000000, 'method' => 'transfer', 'status' => 'verified'],
        ];

        foreach ($payments as $payment) {
            $paymentTerm = PaymentTerm::query()
                ->where('contract_id', $contracts[$payment['contract']]->id)
                ->where('term_number', $payment['term_number'])
                ->firstOrFail();

            Payment::updateOrCreate(
                [
                    'payment_term_id' => $paymentTerm->id,
                    'payment_date' => $payment['payment_date'],
                ],
                [
                    'amount' => $payment['amount'],
                    'method' => $payment['method'],
                    'status' => $payment['status'],
                ],
            );
        }

        Payment::query()->get()->each(function (Payment $payment): void {
            if (! $payment->getFirstMedia('payment_proofs')) {
                File::ensureDirectoryExists(storage_path('app/private'));

                $fixturePath = storage_path('app/private/sample-payment-proof.pdf');

                if (! file_exists($fixturePath)) {
                    file_put_contents($fixturePath, "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
                }

                $payment
                    ->addMedia($fixturePath)
                    ->preservingOriginal()
                    ->usingName('sample-payment-proof')
                    ->usingFileName('sample-payment-proof.pdf')
                    ->withCustomProperties(['notes' => 'Seeded proof'])
                    ->toMediaCollection('payment_proofs', config('media-library.disk_name'));
            }
        });

        $progressUpdates = [
            ['contract' => 'KCS-2026-001', 'progress_date' => '2026-02-01', 'progress_title' => 'Setup modul kontrak', 'progress_description' => 'Struktur data kontrak dan relasi inti selesai.', 'percentage' => 35, 'status' => 'in_progress'],
            ['contract' => 'KCS-2026-001', 'progress_date' => '2026-03-10', 'progress_title' => 'Dashboard awal', 'progress_description' => 'Dashboard internal dan ringkasan progres mulai stabil.', 'percentage' => 78, 'status' => 'in_progress'],
            ['contract' => 'KCS-2026-002', 'progress_date' => '2026-03-05', 'progress_title' => 'Alur validasi finance', 'progress_description' => 'Upload bukti bayar dan alur review finance sedang diuji.', 'percentage' => 52, 'status' => 'delayed'],
            ['contract' => 'KCS-2026-003', 'progress_date' => '2026-01-18', 'progress_title' => 'Laporan final', 'progress_description' => 'Dashboard manajemen selesai dan sudah dipresentasikan.', 'percentage' => 100, 'status' => 'completed'],
        ];

        foreach ($progressUpdates as $progressUpdate) {
            $progressOwner = $progressUpdate['contract'] === 'KCS-2026-003' ? $admin : $projectManager;

            ProjectProgress::updateOrCreate(
                [
                    'contract_id' => $contracts[$progressUpdate['contract']]->id,
                    'progress_date' => $progressUpdate['progress_date'],
                    'progress_title' => $progressUpdate['progress_title'],
                ],
                [
                    'progress_description' => $progressUpdate['progress_description'],
                    'percentage' => $progressUpdate['percentage'],
                    'status' => $progressUpdate['status'],
                    'milestone_reference' => 'Milestone '.($progressUpdate['percentage'] >= 100 ? 'final' : 'berjalan'),
                    'notes' => 'Starter data untuk pengujian modul progres.',
                    'updated_by' => $progressOwner->id,
                ],
            );
        }
    }
}
