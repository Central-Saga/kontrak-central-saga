<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Models\PaymentTerm;
use App\Notifications\ContractEndingNotification;
use App\Notifications\PaymentTermDueNotification;
use App\Support\NotificationRecipients;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class SendDueDateReminders extends Command
{
    protected $signature = 'notifications:send-due-date-reminders
                            {--dry-run : List candidates without sending email}
                            {--force : Bypass per-day throttle and resend even if already notified today}';

    protected $description = 'Send daily email reminders for payment terms approaching/overdue and contracts approaching/overdue end date.';

    private const THROTTLE_TTL_SECONDS = 86400;

    public function handle(): int
    {
        if (! config('notifications.enabled', true)) {
            $this->warn('Notifications disabled via NOTIFY_ENABLED=false. Skipping.');

            return self::SUCCESS;
        }

        $today = CarbonImmutable::today();
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $internal = NotificationRecipients::internal();

        if (! $internal && ! $dryRun) {
            $this->warn('NOTIFY_INTERNAL_EMAILS belum di-set. Tidak ada penerima internal.');
        }

        $termResult = $this->processPaymentTerms($today, $internal, $dryRun, $force);
        $contractResult = $this->processContracts($today, $internal, $dryRun, $force);

        $this->info(sprintf(
            '%s %d payment term reminder(s), %d contract reminder(s). Skipped (already sent today): %d termin, %d kontrak.',
            $dryRun ? 'Would send' : 'Sent',
            $termResult['sent'],
            $contractResult['sent'],
            $termResult['skipped'],
            $contractResult['skipped'],
        ));

        return self::SUCCESS;
    }

    /**
     * @return array{sent:int,skipped:int}
     */
    private function processPaymentTerms(
        CarbonImmutable $today,
        ?AnonymousNotifiable $internal,
        bool $dryRun,
        bool $force,
    ): array {
        $remindDays = config('notifications.payment_term_remind_days', [7, 1]);
        $sent = 0;
        $skipped = 0;

        $activeStatuses = ['pending', 'upcoming', 'overdue', 'partially_paid'];

        $terms = PaymentTerm::query()
            ->with(['contract.client'])
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('due_date')
            ->get();

        foreach ($terms as $term) {
            $diff = (int) $today->diffInDays(CarbonImmutable::parse($term->due_date), false);

            $shouldSend = $diff < 0 || in_array($diff, $remindDays, true);

            if (! $shouldSend) {
                continue;
            }

            $cacheKey = $this->throttleKey('payment_term', $term->id, $today);

            if (! $force && ! $dryRun && Cache::has($cacheKey)) {
                $this->line(sprintf(' - PaymentTerm #%d skipped (already notified today)', $term->id));
                $skipped++;

                continue;
            }

            $this->line(sprintf(
                ' - PaymentTerm #%d (%s, due %s, days=%d)',
                $term->id,
                $term->term_title,
                optional($term->due_date)->format('Y-m-d') ?? '-',
                $diff,
            ));

            if ($dryRun) {
                $sent++;

                continue;
            }

            $notification = new PaymentTermDueNotification($term, $diff);

            if ($internal) {
                Notification::send($internal, $notification);
            }

            $clientEmail = $term->contract?->client?->email;
            $clientNotifiable = NotificationRecipients::forEmail($clientEmail);

            if ($clientNotifiable) {
                Notification::send($clientNotifiable, $notification);
            }

            Cache::put($cacheKey, true, self::THROTTLE_TTL_SECONDS);
            $sent++;
        }

        return ['sent' => $sent, 'skipped' => $skipped];
    }

    /**
     * @return array{sent:int,skipped:int}
     */
    private function processContracts(
        CarbonImmutable $today,
        ?AnonymousNotifiable $internal,
        bool $dryRun,
        bool $force,
    ): array {
        $remindDays = config('notifications.contract_ending_remind_days', [30, 7, 1]);
        $sent = 0;
        $skipped = 0;

        $activeStatuses = ['active', 'draft'];

        $contracts = Contract::query()
            ->with('client')
            ->whereIn('contract_status', $activeStatuses)
            ->whereNotNull('end_date')
            ->get();

        foreach ($contracts as $contract) {
            $diff = (int) $today->diffInDays(CarbonImmutable::parse($contract->end_date), false);

            $shouldSend = $diff < 0 || in_array($diff, $remindDays, true);

            if (! $shouldSend) {
                continue;
            }

            $cacheKey = $this->throttleKey('contract', $contract->id, $today);

            if (! $force && ! $dryRun && Cache::has($cacheKey)) {
                $this->line(sprintf(' - Contract #%d skipped (already notified today)', $contract->id));
                $skipped++;

                continue;
            }

            $this->line(sprintf(
                ' - Contract #%d (%s, end %s, days=%d)',
                $contract->id,
                $contract->contract_number,
                optional($contract->end_date)->format('Y-m-d') ?? '-',
                $diff,
            ));

            if ($dryRun) {
                $sent++;

                continue;
            }

            $notification = new ContractEndingNotification($contract, $diff);

            if ($internal) {
                Notification::send($internal, $notification);
            }

            $clientEmail = $contract->client?->email;
            $clientNotifiable = NotificationRecipients::forEmail($clientEmail);

            if ($clientNotifiable) {
                Notification::send($clientNotifiable, $notification);
            }

            Cache::put($cacheKey, true, self::THROTTLE_TTL_SECONDS);
            $sent++;
        }

        return ['sent' => $sent, 'skipped' => $skipped];
    }

    private function throttleKey(string $entity, int $id, CarbonImmutable $today): string
    {
        return sprintf('notifications:reminder:%s:%d:%s', $entity, $id, $today->format('Y-m-d'));
    }
}
