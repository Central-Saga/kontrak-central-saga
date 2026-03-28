<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable([
    'contract_id',
    'progress_date',
    'progress_title',
    'progress_description',
    'percentage',
    'status',
    'milestone_reference',
    'notes',
    'updated_by',
])]
class ProjectProgress extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectProgressFactory> */
    use HasFactory, LogsActivity;

    public const array STATUSES = [
        'not_started',
        'in_progress',
        'on_hold',
        'delayed',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'progress_date' => 'date',
            'percentage' => 'integer',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('project-progress')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
