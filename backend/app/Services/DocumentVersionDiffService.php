<?php

namespace App\Services;

use App\Models\ContractDocumentVersion;
use App\Models\DocumentVersionAuditLog;
use Illuminate\Support\Facades\Log;

class DocumentVersionDiffService
{
    private const SUPPORTED_MIME_TYPES = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml',
        'text/markdown',
        'text/csv',
    ];

    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function canDiffContent(ContractDocumentVersion $version): bool
    {
        if (!in_array($version->mime_type, self::SUPPORTED_MIME_TYPES)) {
            return false;
        }

        if ($version->size_bytes > self::MAX_FILE_SIZE) {
            return false;
        }

        return true;
    }

    public function getContent(ContractDocumentVersion $version): ?string
    {
        if (!$this->canDiffContent($version)) {
            return null;
        }

        try {
            $path = $version->media->getPath();

            if (!file_exists($path)) {
                Log::warning('File tidak ditemukan untuk version', [
                    'version_id' => $version->id,
                    'path' => $path,
                ]);

                return null;
            }

            $content = file_get_contents($path);

            if ($content === false) {
                return null;
            }

            return $this->normalizeContent($content);
        } catch (\Exception $e) {
            Log::error('Gagal membaca konten file', [
                'version_id' => $version->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function compareVersions(
        ContractDocumentVersion $fromVersion,
        ContractDocumentVersion $toVersion,
        string $renderer = 'SideBySide',
    ): array {
        $fromContent = $this->getContent($fromVersion);
        $toContent = $this->getContent($toVersion);

        if ($fromContent === null || $toContent === null) {
            return [
                'can_diff_content' => false,
                'from_content_preview' => $this->getContentPreview($fromVersion),
                'to_content_preview' => $this->getContentPreview($toVersion),
                'diff_html' => null,
                'line_changes' => null,
                'message' => 'File tidak bisa dibaca untuk perbandingan konten (bukan file teks atau file tidak ditemukan).',
            ];
        }

        $differOptions = [
            'context' => 3,
            'ignoreCase' => false,
            'ignoreWhitespace' => false,
        ];

        $rendererOptions = [
            'detailLevel' => 'line',
            'lineNumbers' => true,
            'showHeader' => true,
            'separateBlock' => true,
        ];

        $diffHtml = \Jfcherng\Diff\DiffHelper::calculate($fromContent, $toContent, $renderer, $differOptions, $rendererOptions);
        $lineChanges = $this->analyzeLineChanges($fromContent, $toContent);

        return [
            'can_diff_content' => true,
            'from_content_preview' => $this->getContentPreview($fromVersion, $fromContent),
            'to_content_preview' => $this->getContentPreview($toVersion, $toContent),
            'diff_html' => $diffHtml,
            'line_changes' => $lineChanges,
            'message' => null,
        ];
    }

    private function analyzeLineChanges(string $oldContent, string $newContent): array
    {
        $oldLines = explode("\n", $oldContent);
        $newLines = explode("\n", $newContent);

        $oldLineCount = count($oldLines);
        $newLineCount = count($newLines);

        $differ = new \Jfcherng\Diff\Differ($oldLines, $newLines);
        $operations = $differ->getOpcodes();

        $stats = [
            'added' => 0,
            'deleted' => 0,
            'modified' => 0,
            'unchanged' => 0,
        ];

        foreach ($operations as $op) {
            switch ($op->getOpcode()) {
                case 'insert':
                    $stats['added'] += $op->getNewRange()[1] - $op->getNewRange()[0];
                    break;
                case 'delete':
                    $stats['deleted'] += $op->getOldRange()[1] - $op->getOldRange()[0];
                    break;
                case 'replace':
                    $oldCount = $op->getOldRange()[1] - $op->getOldRange()[0];
                    $newCount = $op->getNewRange()[1] - $op->getNewRange()[0];
                    $stats['modified'] += max($oldCount, $newCount);
                    break;
                case 'equal':
                    $stats['unchanged'] += $op->getOldRange()[1] - $op->getOldRange()[0];
                    break;
            }
        }

        return [
            'old_line_count' => $oldLineCount,
            'new_line_count' => $newLineCount,
            'net_change' => $newLineCount - $oldLineCount,
            'stats' => $stats,
        ];
    }

    private function getContentPreview(ContractDocumentVersion $version, ?string $content = null): array
    {
        if ($content === null) {
            $content = $this->getContent($version);
        }

        $lines = $content !== null ? explode("\n", $content) : [];

        return [
            'lines_count' => count($lines),
            'character_count' => $content !== null ? strlen($content) : 0,
            'first_10_lines' => array_slice($lines, 0, 10),
            'is_preview_only' => $content === null,
        ];
    }

    private function normalizeContent(string $content): string
    {
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
        }

        return $content;
    }

    public function createAuditLog(
        ContractDocumentVersion $version,
        string $action,
        ?string $fieldName = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?string $changeSummary = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?int $userId = null,
    ): DocumentVersionAuditLog {
        return DocumentVersionAuditLog::create([
            'document_version_id' => $version->id,
            'user_id' => $userId,
            'action' => $action,
            'field_name' => $fieldName,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'change_summary' => $changeSummary,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'created_at' => now(),
        ]);
    }

    public function getVersionAuditLogs(
        ContractDocumentVersion $version,
        ?string $action = null,
        ?string $fieldName = null,
    ) {
        $query = DocumentVersionAuditLog::where('document_version_id', $version->id)
            ->with(['user:id,name,email'])
            ->orderBy('created_at', 'desc');

        if ($action) {
            $query->where('action', $action);
        }

        if ($fieldName) {
            $query->where('field_name', $fieldName);
        }

        return $query->get();
    }

    public function getContractDocumentHistory(int $contractId, string $documentType = 'main_contract'): array
    {
        $versions = ContractDocumentVersion::where('contract_id', $contractId)
            ->where('document_type', $documentType)
            ->with(['uploader:id,name,email', 'auditLogs.user:id,name,email'])
            ->orderBy('version_number', 'desc')
            ->get();

        $history = [];

        foreach ($versions as $version) {
            $versionEntry = [
                'version' => $version,
                'upload_info' => [
                    'uploaded_at' => $version->uploaded_at,
                    'uploaded_by' => $version->uploader?->name ?? 'Sistem',
                    'change_summary' => $version->change_summary,
                ],
                'audit_trail' => $version->auditLogs,
                'changes_from_previous' => null,
            ];

            if (isset($previousVersion)) {
                $versionEntry['changes_from_previous'] = $this->compareVersions($previousVersion, $version);
            }

            $previousVersion = $version;
            $history[] = $versionEntry;
        }

        return $history;
    }
}