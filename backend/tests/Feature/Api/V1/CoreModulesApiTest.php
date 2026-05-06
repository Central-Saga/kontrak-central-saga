<?php

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ModuleStarterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('filesystems.default', 'public');
    config()->set('media-library.disk_name', 'public');
    Storage::fake('public');

    $this->seed(DatabaseSeeder::class);
});

it('requires authentication for protected summary endpoint', function (): void {
    $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();
});

it('logs in and returns token plus roles and permissions', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@centralsaga.test',
        'password' => 'password',
        'device_name' => 'postman',
    ])
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'token',
                'token_type',
                'user' => ['id', 'name', 'username', 'email', 'avatar_url', 'roles', 'permissions'],
            ],
        ])
        ->assertJsonPath('data.user.username', null)
        ->assertJsonPath('data.user.avatar_url', null);

    $admin = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();
    $token = PersonalAccessToken::query()->where('tokenable_id', $admin->id)->latest('id')->firstOrFail();

    expect($token->abilities)->not->toContain('*')
        ->and($token->abilities)->toContain('read users', 'manage clients', 'read contracts');
});

it('returns avatar url in auth me payload when user has avatar', function (): void {
    $user = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();
    $avatarPath = 'avatars/admin-avatar.png';

    Storage::disk('public')->put($avatarPath, 'avatar-content');
    $user->forceFill(['avatar' => $avatarPath])->save();

    Sanctum::actingAs($user);

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.avatar_url', rtrim((string) config('filesystems.disks.public.url', '/storage'), '/')."/{$avatarPath}");
});

it('updates current user avatar and deletes previous file', function (): void {
    $user = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();
    $oldAvatarPath = 'avatars/old-avatar.png';

    Storage::disk('public')->put($oldAvatarPath, 'old-avatar-content');
    $user->forceFill(['avatar' => $oldAvatarPath])->save();

    Sanctum::actingAs($user);

    $this->post('/api/v1/auth/avatar', [
        'avatar' => UploadedFile::fake()->image('new-avatar.png'),
    ])->assertOk();

    $user->refresh();

    expect($user->avatar)->not->toBeNull();

    Storage::disk('public')->assertExists($user->avatar);
    Storage::disk('public')->assertMissing($oldAvatarPath);

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.avatar_url', rtrim((string) config('filesystems.disks.public.url', '/storage'), '/')."/{$user->avatar}");
});

it('validates avatar upload as image file', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->withHeader('Accept', 'application/json')
        ->post('/api/v1/auth/avatar', [
            'avatar' => UploadedFile::fake()->create('avatar.pdf', 64, 'application/pdf'),
        ])
        ->assertUnprocessable();
});

it('updates current authenticated profile details', function (): void {
    $user = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();

    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/profile', [
        'name' => 'Central Saga Admin Updated',
        'username' => 'central-admin',
        'email' => 'admin-updated@centralsaga.test',
    ])
        ->assertOk()
        ->assertJsonPath('message', 'Profile updated successfully.')
        ->assertJsonPath('data.name', 'Central Saga Admin Updated')
        ->assertJsonPath('data.username', 'central-admin')
        ->assertJsonPath('data.email', 'admin-updated@centralsaga.test');

    $user->refresh();

    expect($user->name)->toBe('Central Saga Admin Updated')
        ->and($user->username)->toBe('central-admin')
        ->and($user->email)->toBe('admin-updated@centralsaga.test');
});

it('validates unique username and email for current authenticated profile updates', function (): void {
    $admin = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();
    $finance = User::query()->where('email', 'finance@centralsaga.test')->firstOrFail();

    $finance->forceFill([
        'username' => 'finance-user',
    ])->save();

    Sanctum::actingAs($admin);

    $this->putJson('/api/v1/auth/profile', [
        'username' => 'finance-user',
        'email' => 'finance@centralsaga.test',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username', 'email']);
});

it('changes current authenticated password with current_password validation', function (): void {
    $user = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();

    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/password', [
        'current_password' => 'password',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])
        ->assertOk()
        ->assertJsonPath('message', 'Password updated successfully.');

    $user->refresh();

    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();
});

it('rejects password update when current password is invalid', function (): void {
    $user = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();

    Sanctum::actingAs($user);

    $this->putJson('/api/v1/auth/password', [
        'current_password' => 'wrong-password',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);
});

it('returns dashboard summary for authorized api v1 user', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonPath('data.clients.total', 3)
        ->assertJsonPath('data.contracts.total', 3)
        ->assertJsonPath('data.payment_terms.overdue', 2)
        ->assertJsonPath('data.payments.verified', 5);
});

it('scopes dashboard summary to the authenticated client data when reporting permission is assigned', function (): void {
    $clientUser = User::query()->where('email', 'client@centralsaga.test')->firstOrFail();
    $clientUser->givePermissionTo('view reporting dashboard');

    Sanctum::actingAs($clientUser);

    $this->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonPath('data.clients.total', 1)
        ->assertJsonPath('data.contracts.total', 1)
        ->assertJsonPath('data.contracts.total_value', '450000000.00')
        ->assertJsonPath('data.payment_terms.total', 3)
        ->assertJsonPath('data.payments.total', 1)
        ->assertJsonPath('data.payments.verified', 1)
        ->assertJsonPath('data.project_progress.total_updates', 2);
});

it('scopes client index to the authenticated client even if manage clients permission is assigned', function (): void {
    $clientUser = User::query()->where('email', 'client@centralsaga.test')->firstOrFail();
    $clientUser->givePermissionTo('manage clients');

    Sanctum::actingAs($clientUser);

    $this->getJson('/api/v1/clients')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.user_id', $clientUser->id);

    $otherClient = Client::query()->create([
        'client_code' => 'CL-OTHER-AUTH',
        'company_name' => 'Other Client Auth Test',
        'contact_person' => 'Other Contact',
        'email' => 'other-auth-client.test@example.test',
        'phone' => '081200000000',
        'address' => 'Denpasar',
        'status' => 'active',
        'portal_access_enabled' => false,
        'user_id' => null,
    ]);

    $this->getJson("/api/v1/clients/{$otherClient->id}")
        ->assertForbidden();

    $this->putJson("/api/v1/clients/{$otherClient->id}", [
        'company_name' => 'Client Cannot Update Other Client',
    ])->assertForbidden();

    $this->deleteJson("/api/v1/clients/{$otherClient->id}")
        ->assertForbidden();
});

it('returns contract detail with related payment terms and latest progress', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $contract = Contract::query()->where('contract_number', 'KCS-2026-001')->firstOrFail();

    $this->getJson("/api/v1/contracts/{$contract->id}")
        ->assertOk()
        ->assertJsonPath('data.contract_number', 'KCS-2026-001')
        ->assertJsonCount(3, 'data.payment_terms')
        ->assertJsonPath('data.document_versions_count', 0)
        ->assertJsonPath('data.latest_progress.percentage', 78);
});

it('creates a client through api v1', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->postJson('/api/v1/clients', [
        'client_code' => 'CL-010',
        'company_name' => 'PT Demo Postman',
        'contact_person' => 'Sari Utama',
        'email' => 'sari@demo-postman.test',
        'phone' => '0812-9999-0010',
        'address' => 'Bandung, Jawa Barat',
        'status' => 'active',
        'portal_access_enabled' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.client_code', 'CL-010')
        ->assertJsonPath('data.company_name', 'PT Demo Postman');
});

it('returns payments index with related payment term data', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'finance@centralsaga.test')->firstOrFail());

    $this->getJson('/api/v1/payments')
        ->assertOk()
        ->assertJsonPath('meta.total', 6)
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'payment_term_id',
                    'payment_term' => ['id', 'term_number', 'term_title', 'status'],
                    'payment_date',
                    'amount',
                    'method',
                    'status',
                ],
            ],
        ]);
});

it('uploads a payment proof only for the authenticated client own payment', function (): void {
    $clientUser = User::query()->where('email', 'client@centralsaga.test')->firstOrFail();
    Sanctum::actingAs($clientUser);

    $payment = Payment::query()
        ->whereHas('paymentTerm.contract.client', fn ($query) => $query->where('user_id', $clientUser->id))
        ->firstOrFail();

    $this->post("/api/v1/payments/{$payment->id}/proof", [
        'file' => UploadedFile::fake()->image('proof.png'),
        'notes' => 'Bukti transfer dari client',
    ])
        ->assertCreated()
        ->assertJsonPath('data.payment.id', $payment->id)
        ->assertJsonPath('data.proof.notes', 'Bukti transfer dari client');
});

it('forbids client payment proof uploads for other client payments', function (): void {
    $clientUser = User::query()->where('email', 'client@centralsaga.test')->firstOrFail();
    Sanctum::actingAs($clientUser);

    $otherClient = Client::query()->create([
        'client_code' => 'CL-OTHER-PAYMENT',
        'company_name' => 'Other Payment Client',
        'contact_person' => 'Other Payment Contact',
        'email' => 'other-payment-client.test@example.test',
        'phone' => '081200000001',
        'address' => 'Denpasar',
        'status' => 'active',
        'portal_access_enabled' => false,
        'user_id' => null,
    ]);
    $contract = Contract::query()->create([
        'client_id' => $otherClient->id,
        'contract_number' => 'KCS-AUTH-OTHER',
        'contract_title' => 'Other Client Contract',
        'project_name' => 'Other Client Project',
        'contract_date' => '2026-01-01',
        'start_date' => '2026-01-02',
        'end_date' => '2026-02-01',
        'contract_value' => 1000000,
        'project_scope' => 'Authorization fixture.',
        'payment_scheme_summary' => '100%',
        'contract_status' => 'active',
        'notes' => 'Authorization fixture.',
    ]);
    $paymentTerm = PaymentTerm::query()->create([
        'contract_id' => $contract->id,
        'term_number' => 1,
        'term_title' => 'Other Client Term',
        'due_date' => '2026-01-15',
        'amount' => 1000000,
        'description' => 'Authorization fixture.',
        'status' => 'pending',
        'payable_after_condition' => 'Authorization fixture.',
    ]);
    $payment = Payment::query()->create([
        'payment_term_id' => $paymentTerm->id,
        'payment_date' => '2026-01-15',
        'amount' => 1000000,
        'method' => 'transfer',
        'status' => 'pending_review',
    ]);

    $this->post("/api/v1/payments/{$payment->id}/proof", [
        'file' => UploadedFile::fake()->image('proof.png'),
        'notes' => 'Bukti transfer dari client',
    ])->assertForbidden();
});

it('rejects contract document uploads larger than 20 mb', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    Config::set('media-library.max_file_size', 1024 * 1024 * 20);

    $contract = Contract::query()->where('contract_number', 'KCS-2026-001')->firstOrFail();

    $this->withHeader('Accept', 'application/json')->post("/api/v1/contracts/{$contract->id}/document-versions", [
        'file' => UploadedFile::fake()->create('contract-too-large.pdf', 21 * 1024, 'application/pdf'),
        'document_type' => 'main_contract',
        'version_status' => 'draft',
        'change_summary' => 'Melebihi batas ukuran dokumen kontrak.',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});

it('stores contract document versions and compares version metadata', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $contract = Contract::query()->where('contract_number', 'KCS-2026-001')->firstOrFail();

    $firstUploadResponse = $this->post("/api/v1/contracts/{$contract->id}/document-versions", [
        'file' => UploadedFile::fake()->createWithContent('contract-v1.pdf', "%PDF-1.4\ncontract-version-1"),
        'document_type' => 'main_contract',
        'version_status' => 'draft',
        'change_summary' => 'Versi awal untuk ditinjau internal.',
    ]);

    $firstUploadResponse
        ->assertCreated()
        ->assertJsonPath('data.contract_id', $contract->id)
        ->assertJsonPath('data.version_number', 1)
        ->assertJsonPath('data.version_status', 'draft');

    $firstVersionId = (int) $firstUploadResponse->json('data.id');

    $secondUploadResponse = $this->post("/api/v1/contracts/{$contract->id}/document-versions", [
        'file' => UploadedFile::fake()->createWithContent('contract-v2.pdf', "%PDF-1.4\ncontract-version-2-updated"),
        'document_type' => 'main_contract',
        'version_status' => 'final',
        'change_summary' => 'Versi final setelah revisi legal.',
    ]);

    $secondUploadResponse
        ->assertCreated()
        ->assertJsonPath('data.version_number', 2)
        ->assertJsonPath('data.version_status', 'final');

    $secondVersionId = (int) $secondUploadResponse->json('data.id');

    $this->getJson("/api/v1/contracts/{$contract->id}/document-versions?document_type=main_contract")
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.version_number', 2)
        ->assertJsonPath('data.1.version_number', 1);

    $this->getJson("/api/v1/contracts/{$contract->id}/document-versions/compare?from_version_id={$firstVersionId}&to_version_id={$secondVersionId}")
        ->assertOk()
        ->assertJsonPath('data.contract_id', $contract->id)
        ->assertJsonPath('data.same_file', false)
        ->assertJsonPath('data.from_version.id', $firstVersionId)
        ->assertJsonPath('data.to_version.id', $secondVersionId);

    $this->get("/api/v1/contracts/{$contract->id}/document-versions/{$secondVersionId}/download")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename="contract-v2.pdf"');
});

it('exports contracts report as pdf for authorized user', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->get('/api/v1/exports/contracts?format=pdf')
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('seeds role and permission foundation for user access modules', function (): void {
    expect(Role::query()->pluck('name')->all())
        ->toContain('admin', 'finance', 'project-manager', 'client');

    expect(Permission::query()->pluck('name')->all())
        ->toContain(
            'create users',
            'read roles',
            'update permissions',
            'verification payment proofs',
            'export contracts',
            'read project progress'
        );
});

it('restricts user access management endpoints to admin users', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'finance@centralsaga.test')->firstOrFail());

    $this->getJson('/api/v1/users?search=Central&per_page=5')
        ->assertForbidden();

    $this->postJson('/api/v1/users', [
        'name' => 'Finance Cannot Create',
        'email' => 'finance-no-create@centralsaga.test',
        'password' => 'password123',
    ])->assertForbidden();

    $this->getJson('/api/v1/roles')
        ->assertForbidden();

    $this->getJson('/api/v1/permissions')
        ->assertForbidden();
});

it('supports users crud with role syncing and optional password update', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $clientRole = Role::query()->where('name', 'client')->firstOrFail();
    $financeRole = Role::query()->where('name', 'finance')->firstOrFail();

    $createResponse = $this->postJson('/api/v1/users', [
        'name' => 'API User Manager',
        'email' => 'api-user-manager@centralsaga.test',
        'password' => 'password123',
        'role_ids' => [$clientRole->id],
    ])->assertCreated();

    $userId = (int) $createResponse->json('data.id');

    $this->getJson("/api/v1/users/{$userId}")
        ->assertOk()
        ->assertJsonPath('data.email', 'api-user-manager@centralsaga.test')
        ->assertJsonPath('data.roles.0.name', 'client');

    $this->putJson("/api/v1/users/{$userId}", [
        'name' => 'API User Updated',
        'role_ids' => [$financeRole->id],
    ])->assertOk()
        ->assertJsonPath('data.name', 'API User Updated')
        ->assertJsonPath('data.roles.0.name', 'finance');

    $storedUser = User::query()->findOrFail($userId);

    expect(Hash::check('password123', $storedUser->password))->toBeTrue();

    $this->putJson("/api/v1/users/{$userId}", [
        'password' => 'newpassword123',
    ])->assertOk();

    $storedUser = User::query()->findOrFail($userId);

    expect(Hash::check('newpassword123', $storedUser->password))->toBeTrue();

    $this->deleteJson("/api/v1/users/{$userId}")
        ->assertNoContent();
});

it('prevents deleting the primary seeded user account', function (): void {
    Sanctum::actingAs(User::query()->where('email', ModuleStarterSeeder::PRIMARY_USER_EMAIL)->firstOrFail());

    $primaryUser = User::query()->where('email', ModuleStarterSeeder::PRIMARY_USER_EMAIL)->firstOrFail();

    $this->deleteJson("/api/v1/users/{$primaryUser->id}")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Akun utama tidak dapat dihapus.');

    expect(User::query()->whereKey($primaryUser->id)->exists())->toBeTrue();
});

it('supports roles crud with permission syncing and conflict on delete', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $readUsersPermission = Permission::query()->where('name', 'read users')->firstOrFail();
    $updateUsersPermission = Permission::query()->where('name', 'update users')->firstOrFail();

    $createResponse = $this->postJson('/api/v1/roles', [
        'name' => 'qa-role',
        'permission_ids' => [$readUsersPermission->id, $updateUsersPermission->id],
    ])->assertCreated()
        ->assertJsonPath('data.guard_name', 'web')
        ->assertJsonPath('data.permissions_count', 2);

    $roleId = (int) $createResponse->json('data.id');

    $this->getJson("/api/v1/roles/{$roleId}")
        ->assertOk()
        ->assertJsonPath('data.name', 'qa-role');

    $readRolesPermission = Permission::query()->where('name', 'read roles')->firstOrFail();

    $this->putJson("/api/v1/roles/{$roleId}", [
        'name' => 'qa-role-updated',
        'permission_ids' => [$readRolesPermission->id],
    ])->assertOk()
        ->assertJsonPath('data.name', 'qa-role-updated')
        ->assertJsonPath('data.permissions_count', 1);

    $adminRole = Role::query()->where('name', 'admin')->firstOrFail();

    $this->deleteJson("/api/v1/roles/{$adminRole->id}")
        ->assertStatus(409);

    $this->deleteJson("/api/v1/roles/{$roleId}")
        ->assertNoContent();
});

it('prevents deleting the primary seeded role even without assigned users', function (): void {
    Sanctum::actingAs(User::query()->where('email', ModuleStarterSeeder::PRIMARY_USER_EMAIL)->firstOrFail());

    $primaryRole = Role::query()->where('name', ModuleStarterSeeder::PRIMARY_ROLE_NAME)->firstOrFail();
    $primaryUser = User::query()->where('email', ModuleStarterSeeder::PRIMARY_USER_EMAIL)->firstOrFail();

    $primaryUser->removeRole($primaryRole);

    $this->deleteJson("/api/v1/roles/{$primaryRole->id}")
        ->assertForbidden();

    expect(Role::query()->whereKey($primaryRole->id)->exists())->toBeTrue();
});

it('supports permissions crud and prevents delete when related', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $createResponse = $this->postJson('/api/v1/permissions', [
        'name' => 'read sandbox module',
    ])->assertCreated()
        ->assertJsonPath('data.guard_name', 'web');

    $permissionId = (int) $createResponse->json('data.id');

    $this->getJson('/api/v1/permissions?search=sandbox&action=read&module=sandbox module')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->getJson("/api/v1/permissions/{$permissionId}")
        ->assertOk()
        ->assertJsonPath('data.name', 'read sandbox module');

    $this->putJson("/api/v1/permissions/{$permissionId}", [
        'name' => 'update sandbox module',
    ])->assertOk()
        ->assertJsonPath('data.name', 'update sandbox module');

    $readUsersPermission = Permission::query()->where('name', 'read users')->firstOrFail();

    $this->deleteJson("/api/v1/permissions/{$readUsersPermission->id}")
        ->assertStatus(409);

    $this->deleteJson("/api/v1/permissions/{$permissionId}")
        ->assertNoContent();
});
