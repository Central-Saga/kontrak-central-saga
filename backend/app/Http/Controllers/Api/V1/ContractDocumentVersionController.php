<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractDocumentVersionRequest;
use App\Http\Resources\ContractDocumentVersionResource;
use App\Models\Contract;
use App\Models\ContractDocumentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractDocumentVersionController extends Controller
{
    public function index(Request $request, Contract $contract): JsonResponse
    {
        $versions = $contract->documentVersions()
            ->with(['media', 'uploader:id,name,email'])
            ->when(
                $request->string('document_type')->toString(),
                fn ($query, $documentType) => $query->where('document_type', $documentType),
            )
            ->get();

        return response()->json([
            'data' => ContractDocumentVersionResource::collection($versions),
        ]);
    }

    public function store(StoreContractDocumentVersionRequest $request, Contract $contract): JsonResponse
    {
        $validated = $request->validated();
        $uploadedFile = $validated['file'];
        $documentType = $validated['document_type'];
        $versionStatus = $validated['version_status'];
        $changeSummary = $validated['change_summary'] ?? null;
        $checksum = hash_file('sha256', $uploadedFile->getRealPath());

        $media = $contract
            ->addMedia($uploadedFile)
            ->withCustomProperties([
                'document_type' => $documentType,
                'version_status' => $versionStatus,
                'change_summary' => $changeSummary,
                'checksum_sha256' => $checksum,
                'uploaded_by' => $request->user()?->email,
            ])
            ->toMediaCollection('contract_documents', config('media-library.disk_name'));

        try {
            $version = DB::transaction(function () use ($changeSummary, $checksum, $contract, $documentType, $media, $request, $uploadedFile, $versionStatus): ContractDocumentVersion {
                Contract::query()->whereKey($contract->id)->lockForUpdate()->first();

                $nextVersionNumber = ContractDocumentVersion::query()
                    ->where('contract_id', $contract->id)
                    ->where('document_type', $documentType)
                    ->max('version_number');

                return ContractDocumentVersion::query()->create([
                    'contract_id' => $contract->id,
                    'media_id' => $media->id,
                    'uploaded_by' => $request->user()?->id,
                    'document_type' => $documentType,
                    'version_number' => ((int) $nextVersionNumber) + 1,
                    'version_status' => $versionStatus,
                    'original_file_name' => $uploadedFile->getClientOriginalName(),
                    'stored_file_name' => $media->file_name,
                    'mime_type' => $media->mime_type ?? $uploadedFile->getMimeType() ?? 'application/octet-stream',
                    'size_bytes' => $media->size,
                    'checksum_sha256' => $checksum,
                    'change_summary' => $changeSummary,
                    'uploaded_at' => now(),
                ]);
            });
        } catch (\Throwable $exception) {
            $media->delete();

            throw $exception;
        }

        $version->load(['media', 'uploader:id,name,email']);

        return response()->json([
            'message' => 'Versi dokumen kontrak berhasil diunggah.',
            'data' => new ContractDocumentVersionResource($version),
        ], 201);
    }

    public function compare(Request $request, Contract $contract): JsonResponse
    {
        $validated = $request->validate([
            'from_version_id' => ['required', 'integer', 'exists:contract_document_versions,id'],
            'to_version_id' => ['required', 'integer', 'exists:contract_document_versions,id', 'different:from_version_id'],
        ]);

        $versions = ContractDocumentVersion::query()
            ->with(['media', 'uploader:id,name,email'])
            ->where('contract_id', $contract->id)
            ->whereIn('id', [$validated['from_version_id'], $validated['to_version_id']])
            ->get()
            ->keyBy('id');

        $fromVersion = $versions->get($validated['from_version_id']);
        $toVersion = $versions->get($validated['to_version_id']);

        abort_unless($fromVersion && $toVersion, 404, 'Versi dokumen kontrak tidak ditemukan.');

        $differences = collect([
            'document_type' => [$fromVersion->document_type, $toVersion->document_type],
            'version_number' => [$fromVersion->version_number, $toVersion->version_number],
            'version_status' => [$fromVersion->version_status, $toVersion->version_status],
            'original_file_name' => [$fromVersion->original_file_name, $toVersion->original_file_name],
            'mime_type' => [$fromVersion->mime_type, $toVersion->mime_type],
            'size_bytes' => [$fromVersion->size_bytes, $toVersion->size_bytes],
            'checksum_sha256' => [$fromVersion->checksum_sha256, $toVersion->checksum_sha256],
            'change_summary' => [$fromVersion->change_summary, $toVersion->change_summary],
            'uploaded_at' => [$fromVersion->uploaded_at?->toAtomString(), $toVersion->uploaded_at?->toAtomString()],
        ])
            ->filter(fn (array $values): bool => $values[0] !== $values[1])
            ->map(fn (array $values, string $field): array => [
                'field' => $field,
                'from' => $values[0],
                'to' => $values[1],
            ])
            ->values();

        return response()->json([
            'data' => [
                'contract_id' => $contract->id,
                'same_file' => $fromVersion->checksum_sha256 === $toVersion->checksum_sha256,
                'from_version' => new ContractDocumentVersionResource($fromVersion),
                'to_version' => new ContractDocumentVersionResource($toVersion),
                'differences' => $differences,
            ],
        ]);
    }

    public function show(Contract $contract, ContractDocumentVersion $version): JsonResponse
    {
        abort_unless($version->contract_id === $contract->id, 404, 'Versi dokumen kontrak tidak ditemukan.');

        $version->load(['media', 'uploader:id,name,email']);

        return response()->json([
            'data' => new ContractDocumentVersionResource($version),
        ]);
    }

    public function download(Contract $contract, ContractDocumentVersion $version): JsonResponse
    {
        abort_unless($version->contract_id === $contract->id, 404, 'Versi dokumen kontrak tidak ditemukan.');

        $version->load('media');

        if (!$version->media) {
            return response()->json(['message' => 'File tidak ditemukan.'], 404);
        }

        $url = $version->media->getUrl();

        return response()->json([
            'data' => [
                'url' => $url,
                'file_name' => $version->original_file_name,
            ],
        ]);
    }
}
