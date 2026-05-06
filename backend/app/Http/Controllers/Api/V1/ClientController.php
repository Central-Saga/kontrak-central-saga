<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Models\User;
use App\Services\ClientUserService;
use App\Support\OperationalDataAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClientUserService $clientUserService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $clientsQuery = Client::query()
            ->withCount([
                'contracts',
                'contracts as active_contracts_count' => fn ($query) => $query->where('contract_status', 'active'),
            ]);

        OperationalDataAccess::scopeClients($clientsQuery, $user);

        $clients = $clientsQuery
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where(function ($nestedQuery) use ($search): void {
                    $nestedQuery
                        ->where('company_name', 'like', "%{$search}%")
                        ->orWhere('client_code', 'like', "%{$search}%");
                }),
            )
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return ClientResource::collection($clients);
    }

    public function store(StoreClientRequest $request): ClientResource|JsonResponse
    {
        $data = $request->validated();

        // If client_code is not provided, generate one
        if (empty($data['client_code'])) {
            $data['client_code'] = Client::generateCode();
        }

        $client = Client::create($data);

        // If portal access is enabled, create user account
        if (! empty($data['portal_access_enabled']) && $data['portal_access_enabled']) {
            $this->clientUserService->createOrUpdateClientUser($client);
        }

        return (new ClientResource($client->loadCount('contracts')->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Client $client): ClientResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessClient($client, $user), 403);

        $client->loadCount([
            'contracts',
            'contracts as active_contracts_count' => fn ($query) => $query->where('contract_status', 'active'),
        ])->load([
            'contracts' => fn ($query) => $query
                ->withCount(['paymentTerms', 'projectProgressUpdates'])
                ->latest('id'),
            'user',
        ]);

        return new ClientResource($client);
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessClient($client, $user), 403);

        $data = $request->validated();
        $oldPortalAccess = $client->portal_access_enabled;

        $client->update($data);

        $newPortalAccess = $client->fresh()->portal_access_enabled;

        // Handle portal access changes
        if (! $oldPortalAccess && $newPortalAccess) {
            // Portal access was just enabled - create user
            $this->clientUserService->createOrUpdateClientUser($client);
        } elseif ($oldPortalAccess && ! $newPortalAccess) {
            // Portal access was just disabled - disable user
            $this->clientUserService->disableClientUser($client);
        }

        return new ClientResource($client->fresh()->loadCount('contracts')->load('user'));
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessClient($client, $user), 403);

        if ($client->contracts()->exists()) {
            return response()->json([
                'message' => 'Client with related contracts cannot be deleted.',
            ], 409);
        }

        $client->delete();

        return response()->json([], 204);
    }

    /**
     * Generate a new unique client code
     */
    public function generateCode(): JsonResponse
    {
        $code = Client::generateCode();

        return response()->json([
            'client_code' => $code,
        ]);
    }
}
