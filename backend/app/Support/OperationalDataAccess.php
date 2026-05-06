<?php

namespace App\Support;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class OperationalDataAccess
{
    public static function canSeeAllOperationalData(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'finance'])
            || $user->can('manage contracts')
            || $user->can('manage payments')
            || $user->can('manage payment terms');
    }

    /**
     * @param  Builder<Client>  $query
     * @return Builder<Client>
     */
    public static function scopeClients(Builder $query, User $user): Builder
    {
        if ($user->hasRole('client')) {
            return $query->where('user_id', $user->id);
        }

        if ($user->hasAnyRole(['admin', 'finance']) || $user->can('manage clients')) {
            return $query;
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * @param  Builder<Contract>  $query
     * @return Builder<Contract>
     */
    public static function scopeContracts(Builder $query, User $user): Builder
    {
        if (self::canSeeAllOperationalData($user)) {
            return $query;
        }

        if ($user->hasRole('project-manager')) {
            return $query->where(function (Builder $nestedQuery) use ($user): void {
                $nestedQuery
                    ->where('created_by', $user->id)
                    ->orWhere('updated_by', $user->id)
                    ->orWhereHas('projectProgressUpdates', fn (Builder $progressQuery): Builder => $progressQuery->where('updated_by', $user->id));
            });
        }

        if ($user->hasRole('client')) {
            return $query->whereHas('client', fn (Builder $clientQuery): Builder => $clientQuery->where('user_id', $user->id));
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * @param  Builder<PaymentTerm>  $query
     * @return Builder<PaymentTerm>
     */
    public static function scopePaymentTerms(Builder $query, User $user): Builder
    {
        return $query->whereHas('contract', fn (Builder $contractQuery): Builder => self::scopeContracts($contractQuery, $user));
    }

    /**
     * @param  Builder<Payment>  $query
     * @return Builder<Payment>
     */
    public static function scopePayments(Builder $query, User $user): Builder
    {
        return $query->whereHas('paymentTerm.contract', fn (Builder $contractQuery): Builder => self::scopeContracts($contractQuery, $user));
    }

    /**
     * @param  Builder<ProjectProgress>  $query
     * @return Builder<ProjectProgress>
     */
    public static function scopeProjectProgress(Builder $query, User $user): Builder
    {
        return $query->whereHas('contract', fn (Builder $contractQuery): Builder => self::scopeContracts($contractQuery, $user));
    }

    public static function canAccessClient(Client $client, User $user): bool
    {
        return self::scopeClients(Client::query()->whereKey($client->getKey()), $user)->exists();
    }

    public static function canAccessContract(Contract $contract, User $user): bool
    {
        return self::scopeContracts(Contract::query()->whereKey($contract->getKey()), $user)->exists();
    }

    public static function canAccessPaymentTerm(PaymentTerm $paymentTerm, User $user): bool
    {
        return self::scopePaymentTerms(PaymentTerm::query()->whereKey($paymentTerm->getKey()), $user)->exists();
    }

    public static function canAccessPayment(Payment $payment, User $user): bool
    {
        return self::scopePayments(Payment::query()->whereKey($payment->getKey()), $user)->exists();
    }

    public static function canAccessProjectProgress(ProjectProgress $projectProgress, User $user): bool
    {
        return self::scopeProjectProgress(ProjectProgress::query()->whereKey($projectProgress->getKey()), $user)->exists();
    }
}
