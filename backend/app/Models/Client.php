<?php

namespace App\Models;

use App\Services\ClientCodeGenerator;
use Database\Factories\ClientFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable([
    'client_code',
    'company_name',
    'contact_person',
    'email',
    'phone',
    'address',
    'status',
    'portal_access_enabled',
    'user_id',
])]
class Client extends Model
{
    /** @use HasFactory<ClientFactory> */
    use HasFactory, LogsActivity;

    public const array STATUSES = [
        'active',
        'inactive',
    ];

    protected function casts(): array
    {
        return [
            'portal_access_enabled' => 'boolean',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a unique client code
     */
    public static function generateCode(): string
    {
        $generator = new ClientCodeGenerator;

        return $generator->generateUnique();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('client')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
