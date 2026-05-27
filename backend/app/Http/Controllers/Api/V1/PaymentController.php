<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\User;
use App\Notifications\PaymentPendingReviewNotification;
use App\Notifications\PaymentStatusUpdatedNotification;
use App\Support\NotificationRecipients;
use App\Support\OperationalDataAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Notification;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $paymentsQuery = Payment::query()
            ->with('paymentTerm:id,contract_id,term_number,term_title,status');

        OperationalDataAccess::scopePayments($paymentsQuery, $user);

        $payments = $paymentsQuery
            ->when($request->integer('payment_term_id'), fn ($query, $paymentTermId) => $query->where('payment_term_id', $paymentTermId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->latest('payment_date')
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request): PaymentResource|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $paymentTerm = PaymentTerm::query()->findOrFail($data['payment_term_id']);

        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);

        $payment = Payment::create($data);
        $this->syncPaymentTermStatus($payment->paymentTerm()->firstOrFail());

        if ($payment->status === 'pending_review') {
            $this->notifyPaymentPendingReview($payment);
        }

        return (new PaymentResource($payment->load('paymentTerm:id,contract_id,term_number,term_title,status')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Payment $payment): PaymentResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessPayment($payment, $user), 403);

        return new PaymentResource($payment->load('paymentTerm:id,contract_id,term_number,term_title,status'));
    }

    public function update(UpdatePaymentRequest $request, Payment $payment): PaymentResource
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $paymentTerm = PaymentTerm::query()->findOrFail($data['payment_term_id']);

        abort_unless(OperationalDataAccess::canAccessPayment($payment, $user), 403);
        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);

        $previousStatus = $payment->status;
        $payment->update($data);
        $this->syncPaymentTermStatus($payment->paymentTerm()->firstOrFail());

        if ($previousStatus !== $payment->status && in_array($payment->status, ['verified', 'rejected'], true)) {
            $this->notifyPaymentStatusChanged($payment, $previousStatus);
        }

        return new PaymentResource($payment->fresh()->load('paymentTerm:id,contract_id,term_number,term_title,status'));
    }

    public function destroy(Request $request, Payment $payment): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessPayment($payment, $user), 403);

        $paymentTerm = $payment->paymentTerm()->first();
        $payment->delete();

        if ($paymentTerm instanceof PaymentTerm) {
            $this->syncPaymentTermStatus($paymentTerm->fresh());
        }

        return response()->json([], 204);
    }

    private function syncPaymentTermStatus(PaymentTerm $paymentTerm): void
    {
        $verifiedAmount = $paymentTerm->payments()
            ->where('status', 'verified')
            ->sum('amount');

        if ($verifiedAmount >= (float) $paymentTerm->amount && $verifiedAmount > 0) {
            $paymentTerm->update(['status' => 'paid']);

            return;
        }

        if ($verifiedAmount > 0) {
            $paymentTerm->update(['status' => 'partially_paid']);

            return;
        }

        if ($paymentTerm->due_date !== null && $paymentTerm->due_date->lt(Carbon::today())) {
            $paymentTerm->update(['status' => 'overdue']);

            return;
        }

        $paymentTerm->update(['status' => 'pending']);
    }

    private function notifyPaymentPendingReview(Payment $payment): void
    {
        $internal = NotificationRecipients::internal();

        if (! $internal) {
            return;
        }

        $notification = new PaymentPendingReviewNotification(
            $payment->load('paymentTerm.contract.client')
        );

        Notification::send($internal, $notification);
    }

    private function notifyPaymentStatusChanged(Payment $payment, string $previousStatus): void
    {
        $payment->load('paymentTerm.contract.client');
        $clientEmail = $payment->paymentTerm?->contract?->client?->email;
        $client = NotificationRecipients::forEmail($clientEmail);

        if (! $client) {
            return;
        }

        Notification::send($client, new PaymentStatusUpdatedNotification($payment, $previousStatus));
    }
}
