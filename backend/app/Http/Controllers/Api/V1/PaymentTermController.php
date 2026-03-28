<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTermResource;
use App\Http\Requests\StorePaymentTermRequest;
use App\Http\Requests\UpdatePaymentTermRequest;
use App\Models\PaymentTerm;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentTermController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $paymentTerms = PaymentTerm::query()
            ->with(['contract:id,client_id,contract_number,contract_title'])
            ->when($request->integer('contract_id'), fn ($query, $contractId) => $query->where('contract_id', $contractId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->boolean('overdue_only'), fn ($query) => $query
                ->whereDate('due_date', '<', Carbon::today())
                ->whereNotIn('status', ['paid', 'cancelled']))
            ->orderBy('due_date')
            ->orderBy('term_number')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return PaymentTermResource::collection($paymentTerms);
    }

    public function store(StorePaymentTermRequest $request): PaymentTermResource|JsonResponse
    {
        $paymentTerm = PaymentTerm::create($request->validated());

        return (new PaymentTermResource($paymentTerm->load('contract:id,client_id,contract_number,contract_title')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(PaymentTerm $paymentTerm): PaymentTermResource
    {
        return new PaymentTermResource($paymentTerm->load([
            'contract:id,client_id,contract_number,contract_title',
            'payments' => fn ($query) => $query->latest('payment_date')->latest('id'),
        ]));
    }

    public function update(UpdatePaymentTermRequest $request, PaymentTerm $paymentTerm): PaymentTermResource
    {
        $paymentTerm->update($request->validated());

        return new PaymentTermResource($paymentTerm->fresh()->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function destroy(PaymentTerm $paymentTerm): JsonResponse
    {
        $paymentTerm->delete();

        return response()->json([], 204);
    }
}
