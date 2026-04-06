<?php

namespace App\Models;

use App\Services\ContractCodeGenerator;
use Database\Factories\ContractFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

#[Fillable([
    'client_id',
    'contract_number',
    'contract_title',
    'project_name',
    'contract_date',
    'start_date',
    'end_date',
    'contract_value',
    'project_scope',
    'payment_scheme_summary',
    'contract_status',
    'notes',
    'created_by',
    'updated_by',
])]
class Contract extends Model implements HasMedia
{
    /** @use HasFactory<ContractFactory> */
    use HasFactory, InteractsWithMedia, LogsActivity;

    public const array STATUSES = [
        'draft',
        'active',
        'completed',
        'terminated',
        'expired',
        'cancelled',
    ];

    public const array DOCUMENT_TYPES = [
        'main_contract',
        'amendment',
        'appendix',
        'supporting_document',
    ];

    public const array DOCUMENT_VERSION_STATUSES = [
        'draft',
        'review',
        'final',
    ];

    protected function casts(): array
    {
        return [
            'contract_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'contract_value' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function paymentTerms(): HasMany
    {
        return $this->hasMany(PaymentTerm::class);
    }

    public function projectProgressUpdates(): HasMany
    {
        return $this->hasMany(ProjectProgress::class);
    }

    public function latestProgress(): HasOne
    {
        return $this->hasOne(ProjectProgress::class)->latestOfMany('progress_date');
    }

    public function documentVersions(): HasMany
    {
        return $this->hasMany(ContractDocumentVersion::class)
            ->orderByDesc('version_number')
            ->orderByDesc('id');
    }

    public function latestDocumentVersion(): HasOne
    {
        return $this->hasOne(ContractDocumentVersion::class)->ofMany('version_number', 'max');
    }

    /**
     * Generate a unique contract number
     */
    public static function generateCode(): string
    {
        $generator = new ContractCodeGenerator;

        return $generator->generateUnique();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('contract_documents')
            ->acceptsMimeTypes([
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/webp',
            ]);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('contract')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
