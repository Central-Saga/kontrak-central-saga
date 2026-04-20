<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DocumentVersionAuditLog extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentVersionAuditLogFactory> */
    use HasFactory;

    protected $fillable = [
        'document_version_id',
        'user_id',
        'action',
        'field_name',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'change_summary',
        'created_at',
    ];

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function documentVersion(): BelongsTo
    {
        return $this->belongsTo(ContractDocumentVersion::class, 'document_version_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk filter berdasarkan action
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope untuk filter berdasarkan field
     */
    public function scopeField($query, string $field)
    {
        return $query->where('field_name', $field);
    }

    /**
     * Scope untuk mendapatkan log terbaru
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}