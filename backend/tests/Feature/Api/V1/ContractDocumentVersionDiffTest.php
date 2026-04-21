<?php

namespace Tests\Feature\Api\V1;

use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractDocumentVersion;
use App\Models\User;
use App\Services\DocumentVersionDiffService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractDocumentVersionDiffTest extends TestCase
{
    use RefreshDatabase;

    private Contract $contract;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $this->admin = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();

        $client = Client::factory()->create();
        $this->contract = Contract::factory()->create([
            'client_id' => $client->id,
        ]);

        Storage::fake('public');
    }

    public function test_compare_content_endpoint_requires_authentication(): void
    {
        $this->getJson("/api/v1/contracts/{$this->contract->id}/document-versions/compare-content")
            ->assertUnauthorized();
    }

    public function test_compare_content_endpoint_requires_permission(): void
    {
        Sanctum::actingAs($this->admin);

        // Remove permission if exists
        $this->admin->revokePermissionTo('manage contracts');

        $this->getJson("/api/v1/contracts/{$this->contract->id}/document-versions/compare-content")
            ->assertForbidden();
    }

    public function test_compare_content_returns_error_when_versions_not_found(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/v1/contracts/{$this->contract->id}/document-versions/compare-content?from_version_id=999&to_version_id=998");

        $response->assertNotFound()
            ->assertJsonPath('message', 'Versi dokumen kontrak tidak ditemukan.');
    }

    public function test_compare_content_returns_diff_for_text_files(): void
    {
        Sanctum::actingAs($this->admin);

        // Create version 1 with text content
        $file1 = UploadedFile::fake()->createWithContent('contract_v1.txt', "Baris 1\nBaris 2\nBaris 3\nBaris 4\nBaris 5");
        $version1 = $this->createDocumentVersion($file1, 1);

        // Create version 2 with modified content
        $file2 = UploadedFile::fake()->createWithContent('contract_v2.txt', "Baris 1\nBaris 2 Modified\nBaris 3\nBaris Baru\nBaris 4\nBaris 5");
        $version2 = $this->createDocumentVersion($file2, 2);

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/compare-content".
            "?from_version_id={$version1->id}&to_version_id={$version2->id}"
        );

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'contract_id',
                    'from_version' => [
                        'id',
                        'version_number',
                        'original_file_name',
                    ],
                    'to_version' => [
                        'id',
                        'version_number',
                        'original_file_name',
                    ],
                    'content_diff' => [
                        'can_diff_content',
                        'from_content_preview' => [
                            'lines_count',
                            'character_count',
                            'first_10_lines',
                            'is_preview_only',
                        ],
                        'to_content_preview' => [
                            'lines_count',
                            'character_count',
                            'first_10_lines',
                            'is_preview_only',
                        ],
                        'diff_html',
                        'line_changes' => [
                            'old_line_count',
                            'new_line_count',
                            'net_change',
                            'stats' => [
                                'added',
                                'deleted',
                                'modified',
                                'unchanged',
                            ],
                        ],
                        'message',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertTrue($data['content_diff']['can_diff_content']);
        $this->assertNotNull($data['content_diff']['diff_html']);
        $this->assertNotNull($data['content_diff']['line_changes']);
        $this->assertEquals(5, $data['content_diff']['line_changes']['old_line_count']);
        $this->assertEquals(6, $data['content_diff']['line_changes']['new_line_count']);
        $this->assertEquals(1, $data['content_diff']['line_changes']['net_change']);
    }

    public function test_compare_content_returns_preview_for_binary_files(): void
    {
        Sanctum::actingAs($this->admin);

        // Create version with binary content (PDF)
        $file = UploadedFile::fake()->create('contract.pdf', 'application/pdf', 1024);
        $version1 = $this->createDocumentVersion($file, 1);
        $version2 = $this->createDocumentVersion($file, 2);

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/compare-content".
            "?from_version_id={$version1->id}&to_version_id={$version2->id}"
        );

        $response->assertOk();

        $data = $response->json('data');
        $this->assertFalse($data['content_diff']['can_diff_content']);
        $this->assertNull($data['content_diff']['diff_html']);
        $this->assertNotNull($data['content_diff']['message']);
    }

    public function test_compare_content_returns_error_for_same_version(): void
    {
        Sanctum::actingAs($this->admin);

        $file = UploadedFile::fake()->createWithContent('contract.txt', 'Content');
        $version = $this->createDocumentVersion($file, 1);

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/compare-content".
            "?from_version_id={$version->id}&to_version_id={$version->id}"
        );

        $response->assertUnprocessable();
    }

    public function test_compare_content_returns_error_for_invalid_version_ids(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/compare-content".
            '?from_version_id=invalid&to_version_id=invalid'
        );

        $response->assertUnprocessable();
    }

    public function test_audit_logs_endpoint_returns_logs_for_version(): void
    {
        Sanctum::actingAs($this->admin);

        $file = UploadedFile::fake()->createWithContent('contract.txt', 'Content');
        $version = $this->createDocumentVersion($file, 1);

        // Create audit log
        $service = app(DocumentVersionDiffService::class);
        $service->createAuditLog(
            $version,
            'created',
            null,
            null,
            null,
            'Test audit log',
            '127.0.0.1',
            'PHPUnit',
            $this->admin->id
        );

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/{$version->id}/audit-logs"
        );

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'document_version_id',
                        'action',
                        'field_name',
                        'old_value',
                        'new_value',
                        'change_summary',
                        'ip_address',
                        'user_agent',
                        'created_at',
                        'user' => [
                            'id',
                            'name',
                            'email',
                        ],
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('created', $data[0]['action']);
        $this->assertEquals($this->admin->id, $data[0]['user']['id']);
    }

    public function test_history_endpoint_returns_contract_document_history(): void
    {
        Sanctum::actingAs($this->admin);

        // Create multiple versions
        $file1 = UploadedFile::fake()->createWithContent('v1.txt', "Line 1\nLine 2");
        $version1 = $this->createDocumentVersion($file1, 1);

        $file2 = UploadedFile::fake()->createWithContent('v2.txt', "Line 1\nLine 2 Modified\nLine 3");
        $version2 = $this->createDocumentVersion($file2, 2);

        $response = $this->getJson(
            "/api/v1/contracts/{$this->contract->id}/document-versions/history"
        );

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'version' => [
                            'id',
                            'version_number',
                            'original_file_name',
                        ],
                        'upload_info' => [
                            'uploaded_at',
                            'uploaded_by',
                            'change_summary',
                        ],
                        'audit_trail',
                        'changes_from_previous',
                    ],
                ],
            ]);
    }

    private function createDocumentVersion(UploadedFile $file, int $versionNumber): ContractDocumentVersion
    {
        $media = $this->contract
            ->addMedia($file)
            ->toMediaCollection('contract_documents', 'public');

        return ContractDocumentVersion::create([
            'contract_id' => $this->contract->id,
            'media_id' => $media->id,
            'uploaded_by' => $this->admin->id,
            'document_type' => 'main_contract',
            'version_number' => $versionNumber,
            'version_status' => 'draft',
            'original_file_name' => $file->getClientOriginalName(),
            'stored_file_name' => $media->file_name,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'checksum_sha256' => hash_file('sha256', $file->getRealPath()),
            'change_summary' => 'Test upload',
            'uploaded_at' => now(),
        ]);
    }
}
