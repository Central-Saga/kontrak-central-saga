<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTermResource;
use App\Http\Requests\StorePaymentTermRequest;
use App\Http\Requests\UpdatePaymentTermRequest;
use App\Models\Contract;
use App\Models\PaymentTerm;
use App\Models\User;
use App\Support\OperationalDataAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentTermController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $paymentTermsQuery = PaymentTerm::query()
            ->with(['contract:id,client_id,contract_number,contract_title']);

        OperationalDataAccess::scopePaymentTerms($paymentTermsQuery, $user);

        $paymentTerms = $paymentTermsQuery
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
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $contract = Contract::query()->findOrFail($data['contract_id']);

        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $paymentTerm = PaymentTerm::create($data);

        return (new PaymentTermResource($paymentTerm->load('contract:id,client_id,contract_number,contract_title')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, PaymentTerm $paymentTerm): PaymentTermResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);

        return new PaymentTermResource($paymentTerm->load([
            'contract:id,client_id,contract_number,contract_title',
            'payments' => fn ($query) => $query->latest('payment_date')->latest('id'),
        ]));
    }

    public function update(UpdatePaymentTermRequest $request, PaymentTerm $paymentTerm): PaymentTermResource
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $contract = Contract::query()->findOrFail($data['contract_id']);

        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);
        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $paymentTerm->update($data);

        return new PaymentTermResource($paymentTerm->fresh()->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function destroy(Request $request, PaymentTerm $paymentTerm): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);

        $paymentTerm->delete();

        return response()->json([], 204);
    }
}
