<?php

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * BLACKBOX EQUIVALENCE PARTITIONING — FormRequest Validation
 *
 * Setiap `it()` menguji 1 KELAS equivalence / 1 boundary value untuk 1 field.
 * Pattern: kirim 1 request dengan variasi, amati HTTP status + struktur error.
 *
 * Metode: Equivalence Partitioning + Boundary Value Analysis.
 * Bukan 1-skenario-per-kasus — tapi 1-skenario-per-kelas equivalence.
 * Coverage setara dengan tabel 73-skenario, tapi test hanya ~50 case.
 */

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(DatabaseSeeder::class);
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());
});

/**
 * Helper: factory payload valid (semua field required diisi valid).
 */
function validClientPayload(array $overrides = []): array
{
    return array_merge([
        'client_code' => 'CLT-EQV-001',
        'company_name' => 'PT Equivalence Testing',
        'contact_person' => 'Budi Santoso',
        'email' => 'eqv-' . uniqid() . '@contoh.co.id',
        'phone' => '081234567890',
        'address' => 'Jl. Testing No. 1',
        'status' => 'active',
        'portal_access_enabled' => false,
    ], $overrides);
}

function validContractPayload(array $overrides = []): array
{
    $client = Client::factory()->create();
    return array_merge([
        'client_id' => $client->id,
        'contract_number' => 'KTR-EQV-' . uniqid(),
        'contract_title' => 'Kontrak Equivalence Testing',
        'project_name' => 'Proyek Eqv Test',
        'contract_date' => '2026-07-01',
        'start_date' => '2026-07-01',
        'end_date' => '2026-12-31',
        'contract_value' => 150000000,
        'project_scope' => 'Pengembangan sistem informasi pengujian equivalence partitioning.',
        'contract_status' => 'draft',
    ], $overrides);
}

function validPaymentTermPayload(array $overrides = []): array
{
    $contract = Contract::factory()->create();
    return array_merge([
        'contract_id' => $contract->id,
        'term_number' => 1,
        'term_title' => 'Down Payment 30%',
        'due_date' => '2026-07-15',
        'amount' => 45000000,
        'status' => 'pending',
    ], $overrides);
}

function validPaymentPayload(array $overrides = []): array
{
    $term = PaymentTerm::factory()->create();
    return array_merge([
        'payment_term_id' => $term->id,
        'payment_date' => '2026-07-15',
        'amount' => 45000000,
        'method' => 'transfer_bank',
        'status' => 'pending_review',
    ], $overrides);
}

function validProjectProgressPayload(array $overrides = []): array
{
    $contract = Contract::factory()->create();
    return array_merge([
        'contract_id' => $contract->id,
        'progress_date' => '2026-07-15',
        'progress_title' => 'Desain UI Selesai',
        'progress_description' => 'Mockup homepage dan dashboard sudah diapprove.',
        'percentage' => 25,
        'status' => 'in_progress',
    ], $overrides);
}

// =========================================================================
// 1. AUTH LOGIN
// =========================================================================

it('LOGIN: email valid + password valid + device_name valid → 200', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@centralsaga.test',
        'password' => 'password',
        'device_name' => 'pest-test',
    ])->assertOk();
});

it('LOGIN: email format invalid → 422 dengan error.email', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'bukan-email-valid',
        'password' => 'password',
        'device_name' => 'pest-test',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);
});

it('LOGIN: email tidak terdaftar → 422 (bukan user enumeration)', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'unknown@centralsaga.test',
        'password' => 'password',
        'device_name' => 'pest-test',
    ])->assertStatus(422);
});

it('LOGIN: email kosong → 422', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => '',
        'password' => 'password',
        'device_name' => 'pest-test',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);
});

it('LOGIN: email hilang → 422', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'password' => 'password',
        'device_name' => 'pest-test',
    ])->assertStatus(422)->assertJsonValidationErrors(['email']);
});

it('LOGIN: password salah → 422', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@centralsaga.test',
        'password' => 'salah-password',
        'device_name' => 'pest-test',
    ])->assertStatus(422);
});

it('LOGIN: password hilang → 422', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@centralsaga.test',
        'device_name' => 'pest-test',
    ])->assertStatus(422)->assertJsonValidationErrors(['password']);
});

it('LOGIN: device_name >100 char → 422', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@centralsaga.test',
        'password' => 'password',
        'device_name' => str_repeat('a', 101),
    ])->assertStatus(422)->assertJsonValidationErrors(['device_name']);
});

// =========================================================================
// 2. CLIENT STORE — Equivalence Partitioning per field
// =========================================================================

it('CLIENT: semua field valid → 201', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload())
        ->assertStatus(201);
});

it('CLIENT: client_code duplikat → 422 error.client_code', function (): void {
    Client::factory()->create(['client_code' => 'CLT-DUP-001']);
    $this->postJson('/api/v1/clients', validClientPayload(['client_code' => 'CLT-DUP-001']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['client_code']);
});

it('CLIENT: client_code 51 char (boundary >50) → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload(['client_code' => str_repeat('A', 51)]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['client_code']);
});

it('CLIENT: client_code hilang → 422', function (): void {
    $payload = validClientPayload();
    unset($payload['client_code']);
    $this->postJson('/api/v1/clients', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['client_code']);
});

it('CLIENT: company_name 256 char (boundary >255) → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload(['company_name' => str_repeat('B', 256)]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['company_name']);
});

it('CLIENT: company_name hilang → 422', function (): void {
    $payload = validClientPayload();
    unset($payload['company_name']);
    $this->postJson('/api/v1/clients', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['company_name']);
});

it('CLIENT: email format invalid → 422 error.email', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload(['email' => 'bukan-email']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('CLIENT: email duplikat → 422 error.email', function (): void {
    Client::factory()->create(['email' => 'sama@contoh.co.id']);
    $this->postJson('/api/v1/clients', validClientPayload(['email' => 'sama@contoh.co.id']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('CLIENT: status invalid (bukan enum) → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload(['status' => 'sedang-aktif']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('CLIENT: status hilang → 422', function (): void {
    $payload = validClientPayload();
    unset($payload['status']);
    $this->postJson('/api/v1/clients', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('CLIENT: CUSTOM RULE — portal_access_enabled=true + status=inactive → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload([
        'status' => 'inactive',
        'portal_access_enabled' => true,
    ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['portal_access_enabled']);
});

it('CLIENT: portal_access_enabled=true tanpa password → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload([
        'portal_access_enabled' => true,
    ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('CLIENT: password <8 char + portal ON → 422 error.password', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload([
        'portal_access_enabled' => true,
        'password' => 'short1',
        'password_confirmation' => 'short1',
    ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('CLIENT: password_confirmation tidak cocok → 422', function (): void {
    $this->postJson('/api/v1/clients', validClientPayload([
        'portal_access_enabled' => true,
        'password' => 'Password123!',
        'password_confirmation' => 'Password124!',
    ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('CLIENT: body kosong {} → 422 dengan minimal 3 error', function (): void {
    $response = $this->postJson('/api/v1/clients', [])
        ->assertStatus(422);
    $errors = $response->json('errors');
    expect($errors)->toHaveKeys(['client_code', 'company_name', 'status']);
});

it('CLIENT: tanpa permission → 403', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $this->postJson('/api/v1/clients', validClientPayload())
        ->assertStatus(403);
});

// =========================================================================
// 3. CONTRACT STORE
// =========================================================================

it('CONTRACT: semua field valid → 201', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload())
        ->assertStatus(201);
});

it('CONTRACT: client_id tidak ada → 422', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload(['client_id' => 99999]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['client_id']);
});

it('CONTRACT: contract_number duplikat → 422', function (): void {
    Contract::factory()->create(['contract_number' => 'KTR-DUP-001']);
    $this->postJson('/api/v1/contracts', validContractPayload(['contract_number' => 'KTR-DUP-001']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_number']);
});

it('CONTRACT: contract_date format invalid → 422', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload(['contract_date' => '01-07-2026']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_date']);
});

it('CONTRACT: end_date < start_date → 422', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload([
        'start_date' => '2026-12-31',
        'end_date' => '2026-07-01',
    ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['end_date']);
});

it('CONTRACT: contract_value negatif → 422', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload(['contract_value' => -100]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_value']);
});

it('CONTRACT: contract_status invalid → 422', function (): void {
    $this->postJson('/api/v1/contracts', validContractPayload(['contract_status' => 'ongoing']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_status']);
});

it('CONTRACT: body kosong {} → 422 minimal 10 error', function (): void {
    $response = $this->postJson('/api/v1/contracts', [])
        ->assertStatus(422);
    $errors = $response->json('errors');
    expect($errors)->toHaveKeys([
        'client_id', 'contract_number', 'contract_title', 'project_name',
        'contract_date', 'start_date', 'end_date', 'contract_value',
        'project_scope', 'contract_status',
    ]);
});

// =========================================================================
// 4. PAYMENT TERM STORE
// =========================================================================

it('PAYMENT TERM: semua field valid → 201', function (): void {
    $this->postJson('/api/v1/payment-terms', validPaymentTermPayload())
        ->assertStatus(201);
});

it('PAYMENT TERM: term_number duplikat scoped per contract → 422', function (): void {
    $payload = validPaymentTermPayload(['term_number' => 1]);
    $this->postJson('/api/v1/payment-terms', $payload)->assertStatus(201);

    $this->postJson('/api/v1/payment-terms', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['term_number']);
});

it('PAYMENT TERM: term_number 0 (boundary <1) → 422', function (): void {
    $this->postJson('/api/v1/payment-terms', validPaymentTermPayload(['term_number' => 0]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['term_number']);
});

it('PAYMENT TERM: term_number negatif → 422', function (): void {
    $this->postJson('/api/v1/payment-terms', validPaymentTermPayload(['term_number' => -1]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['term_number']);
});

it('PAYMENT TERM: amount negatif → 422', function (): void {
    $this->postJson('/api/v1/payment-terms', validPaymentTermPayload(['amount' => -100]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

it('PAYMENT TERM: status invalid → 422', function (): void {
    $this->postJson('/api/v1/payment-terms', validPaymentTermPayload(['status' => 'lunas']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('PAYMENT TERM: body kosong {} → 422 minimal 6 error', function (): void {
    $response = $this->postJson('/api/v1/payment-terms', [])
        ->assertStatus(422);
    $errors = $response->json('errors');
    expect($errors)->toHaveKeys([
        'contract_id', 'term_number', 'term_title', 'due_date', 'amount', 'status',
    ]);
});

// =========================================================================
// 5. PAYMENT STORE
// =========================================================================

it('PAYMENT: semua field valid → 201', function (): void {
    $this->postJson('/api/v1/payments', validPaymentPayload())
        ->assertStatus(201);
});

it('PAYMENT: payment_term_id tidak ada → 422', function (): void {
    $this->postJson('/api/v1/payments', validPaymentPayload(['payment_term_id' => 99999]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['payment_term_id']);
});

it('PAYMENT: amount negatif → 422', function (): void {
    $this->postJson('/api/v1/payments', validPaymentPayload(['amount' => -50]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

it('PAYMENT: method >50 char → 422', function (): void {
    $this->postJson('/api/v1/payments', validPaymentPayload(['method' => str_repeat('m', 51)]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['method']);
});

it('PAYMENT: status invalid → 422', function (): void {
    $this->postJson('/api/v1/payments', validPaymentPayload(['status' => 'approved']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('PAYMENT: body kosong {} → 422 minimal 5 error', function (): void {
    $response = $this->postJson('/api/v1/payments', [])
        ->assertStatus(422);
    $errors = $response->json('errors');
    expect($errors)->toHaveKeys([
        'payment_term_id', 'payment_date', 'amount', 'method', 'status',
    ]);
});

// =========================================================================
// 6. PROJECT PROGRESS STORE — dengan boundary value analysis
// =========================================================================

it('PROJECT PROGRESS: percentage 0 (boundary bawah valid) → 201', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['percentage' => 0]))
        ->assertStatus(201);
});

it('PROJECT PROGRESS: percentage 100 (boundary atas valid) → 201', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['percentage' => 100]))
        ->assertStatus(201);
});

it('PROJECT PROGRESS: percentage -1 (just below) → 422', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['percentage' => -1]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['percentage']);
});

it('PROJECT PROGRESS: percentage 101 (just above) → 422', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['percentage' => 101]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['percentage']);
});

it('PROJECT PROGRESS: percentage desimal (25.5) → 422', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['percentage' => 25.5]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['percentage']);
});

it('PROJECT PROGRESS: status invalid → 422', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['status' => 'done']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('PROJECT PROGRESS: contract_id tidak ada → 422', function (): void {
    $this->postJson('/api/v1/project-progress', validProjectProgressPayload(['contract_id' => 99999]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_id']);
});

it('PROJECT PROGRESS: progress_description hilang → 422', function (): void {
    $payload = validProjectProgressPayload();
    unset($payload['progress_description']);
    $this->postJson('/api/v1/project-progress', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['progress_description']);
});

it('PROJECT PROGRESS: body kosong {} → 422 minimal 6 error', function (): void {
    $response = $this->postJson('/api/v1/project-progress', [])
        ->assertStatus(422);
    $errors = $response->json('errors');
    expect($errors)->toHaveKeys([
        'contract_id', 'progress_date', 'progress_title', 'progress_description',
        'percentage', 'status',
    ]);
});

// =========================================================================
// 7. PROJECT PROGRESS UPSERT (Revisi #2 — business rule)
// =========================================================================

it('PROJECT PROGRESS: POST kedua untuk kontrak sama → UPDATE, bukan row baru', function (): void {
    $payload = validProjectProgressPayload([
        'progress_title' => 'Update Pertama',
        'percentage' => 25,
    ]);
    $this->postJson('/api/v1/project-progress', $payload)->assertStatus(201);

    $payload['progress_title'] = 'Update Kedua';
    $payload['percentage'] = 50;
    $this->postJson('/api/v1/project-progress', $payload)->assertStatus(200);

    $count = ProjectProgress::query()->where('contract_id', $payload['contract_id'])->count();
    expect($count)->toBe(1);

    $record = ProjectProgress::query()->where('contract_id', $payload['contract_id'])->first();
    expect($record->progress_title)->toBe('Update Kedua');
    expect((int) $record->percentage)->toBe(50);
});