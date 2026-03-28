<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Payment;
use App\Models\PaymentTerm;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $payments = Payment::query()
            ->with('paymentTerm:id,contract_id,term_number,term_title,status')
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
        $payment = Payment::create($request->validated());
        $this->syncPaymentTermStatus($payment->paymentTerm()->firstOrFail());

        return (new PaymentResource($payment->load('paymentTerm:id,contract_id,term_number,term_title,status')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Payment $payment): PaymentResource
    {
        return new PaymentResource($payment->load('paymentTerm:id,contract_id,term_number,term_title,status'));
    }

    public function update(UpdatePaymentRequest $request, Payment $payment): PaymentResource
    {
        $payment->update($request->validated());
        $this->syncPaymentTermStatus($payment->paymentTerm()->firstOrFail());

        return new PaymentResource($payment->fresh()->load('paymentTerm:id,contract_id,term_number,term_title,status'));
    }

    public function destroy(Payment $payment): JsonResponse
    {
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
}
