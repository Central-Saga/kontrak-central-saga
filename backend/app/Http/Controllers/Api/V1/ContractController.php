<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContractController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $contracts = Contract::query()
            ->with(['client:id,client_code,company_name'])
            ->withCount(['paymentTerms', 'projectProgressUpdates'])
            ->when($request->integer('client_id'), fn ($query, $clientId) => $query->where('client_id', $clientId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('contract_status', $status))
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where(function ($nestedQuery) use ($search): void {
                    $nestedQuery
                        ->where('contract_number', 'like', "%{$search}%")
                        ->orWhere('contract_title', 'like', "%{$search}%")
                        ->orWhere('project_name', 'like', "%{$search}%");
                }),
            )
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return ContractResource::collection($contracts);
    }

    public function store(StoreContractRequest $request): ContractResource|JsonResponse
    {
        $contract = Contract::create($request->validated());

        return (new ContractResource($contract->load(['client'])->loadCount(['paymentTerms', 'projectProgressUpdates'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Contract $contract): ContractResource
    {
        $contract->load([
            'client:id,client_code,company_name',
            'documentVersions' => fn ($query) => $query->with(['media', 'uploader:id,name,email']),
            'paymentTerms' => fn ($query) => $query->with('payments')->orderBy('term_number'),
            'projectProgressUpdates' => fn ($query) => $query->latest('progress_date')->latest('id'),
            'latestProgress',
        ])->loadCount(['paymentTerms', 'projectProgressUpdates']);

        return new ContractResource($contract);
    }

    public function update(UpdateContractRequest $request, Contract $contract): ContractResource
    {
        $contract->update($request->validated());

        return new ContractResource(
            $contract->fresh()->load(['client:id,client_code,company_name'])->loadCount(['paymentTerms', 'projectProgressUpdates']),
        );
    }

    public function destroy(Contract $contract): JsonResponse
    {
        if ($contract->paymentTerms()->exists() || $contract->projectProgressUpdates()->exists()) {
            return response()->json([
                'message' => 'Contract with related payment terms or progress records cannot be deleted.',
            ], 409);
        }

        $contract->delete();

        return response()->json([], 204);
    }
}
