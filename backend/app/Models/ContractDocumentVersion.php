<?php

namespace App\Models;

use Database\Factories\ContractDocumentVersionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

#[Fillable([
    'contract_id',
    'media_id',
    'uploaded_by',
    'document_type',
    'version_number',
    'version_status',
    'original_file_name',
    'stored_file_name',
    'mime_type',
    'size_bytes',
    'checksum_sha256',
    'change_summary',
    'extracted_text',
    'text_extracted_at',
    'uploaded_at',
])]
class ContractDocumentVersion extends Model
{
    /** @use HasFactory<ContractDocumentVersionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'size_bytes' => 'integer',
            'version_number' => 'integer',
            'text_extracted_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function auditLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DocumentVersionAuditLog::class, 'document_version_id');
    }
}
