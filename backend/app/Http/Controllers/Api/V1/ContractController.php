<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\User;
use App\Support\OperationalDataAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContractController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $contractsQuery = Contract::query()
            ->with(['client:id,client_code,company_name', 'latestDocumentVersion'])
            ->withCount(['paymentTerms', 'projectProgressUpdates', 'documentVersions']);

        OperationalDataAccess::scopeContracts($contractsQuery, $user);

        $contracts = $contractsQuery
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
        $data = $request->validated();

        // If contract_number is not provided, generate one
        if (empty($data['contract_number'])) {
            $data['contract_number'] = Contract::generateCode();
        }

        $contract = Contract::create($data);

        return (new ContractResource($contract->load(['client', 'latestDocumentVersion'])->loadCount(['paymentTerms', 'projectProgressUpdates', 'documentVersions'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Contract $contract): ContractResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $contract->load([
            'client:id,client_code,company_name',
            'documentVersions' => fn ($query) => $query->with(['media', 'uploader:id,name,email']),
            'latestDocumentVersion',
            'paymentTerms' => fn ($query) => $query->with('payments')->orderBy('term_number'),
            'projectProgressUpdates' => fn ($query) => $query->latest('progress_date')->latest('id'),
            'latestProgress',
        ])->loadCount(['paymentTerms', 'projectProgressUpdates', 'documentVersions']);

        return new ContractResource($contract);
    }

    public function update(UpdateContractRequest $request, Contract $contract): ContractResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $contract->update($request->validated());

        return new ContractResource(
            $contract->fresh()->load(['client:id,client_code,company_name', 'latestDocumentVersion'])->loadCount(['paymentTerms', 'projectProgressUpdates', 'documentVersions']),
        );
    }

    public function destroy(Request $request, Contract $contract): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        if ($contract->paymentTerms()->exists() || $contract->projectProgressUpdates()->exists()) {
            return response()->json([
                'message' => 'Contract with related payment terms or progress records cannot be deleted.',
            ], 409);
        }

        $contract->delete();

        return response()->json([], 204);
    }

    /**
     * Generate a new unique contract number
     */
    public function generateCode(): JsonResponse
    {
        $code = Contract::generateCode();

        return response()->json([
            'contract_number' => $code,
        ]);
    }
}
