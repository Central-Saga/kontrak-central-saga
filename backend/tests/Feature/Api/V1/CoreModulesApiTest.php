<?php

use App\Models\Payment;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

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
                'user' => ['id', 'name', 'email', 'roles', 'permissions'],
            ],
        ]);
});

it('returns dashboard summary for authorized api v1 user', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonPath('data.clients.total', 3)
        ->assertJsonPath('data.contracts.total', 3)
        ->assertJsonPath('data.payment_terms.overdue', 1)
        ->assertJsonPath('data.payments.verified', 5);
});

it('returns contract detail with related payment terms and latest progress', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->getJson('/api/v1/contracts/1')
        ->assertOk()
        ->assertJsonPath('data.contract_number', 'KCS-2026-001')
        ->assertJsonCount(3, 'data.payment_terms')
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

it('uploads a payment proof using media library', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'client@centralsaga.test')->firstOrFail());

    $payment = Payment::query()->where('status', 'pending_review')->firstOrFail();

    $this->post("/api/v1/payments/{$payment->id}/proof", [
        'file' => UploadedFile::fake()->image('proof.png'),
        'notes' => 'Bukti transfer dari client',
    ])
        ->assertCreated()
        ->assertJsonPath('data.payment.id', $payment->id)
        ->assertJsonPath('data.proof.notes', 'Bukti transfer dari client');
});

it('exports contracts report as pdf for authorized user', function (): void {
    Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

    $this->get('/api/v1/exports/contracts?format=pdf')
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});
