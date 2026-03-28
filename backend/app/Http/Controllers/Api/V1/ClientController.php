<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $clients = Client::query()
            ->withCount([
                'contracts',
                'contracts as active_contracts_count' => fn ($query) => $query->where('contract_status', 'active'),
            ])
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
        $client = Client::create($request->validated());

        return (new ClientResource($client->loadCount('contracts')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Client $client): ClientResource
    {
        $client->loadCount([
            'contracts',
            'contracts as active_contracts_count' => fn ($query) => $query->where('contract_status', 'active'),
        ])->load([
            'contracts' => fn ($query) => $query
                ->withCount(['paymentTerms', 'projectProgressUpdates'])
                ->latest('id'),
        ]);

        return new ClientResource($client);
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $client->update($request->validated());

        return new ClientResource($client->fresh()->loadCount('contracts'));
    }

    public function destroy(Client $client): JsonResponse
    {
        if ($client->contracts()->exists()) {
            return response()->json([
                'message' => 'Client with related contracts cannot be deleted.',
            ], 409);
        }

        $client->delete();

        return response()->json([], 204);
    }
}
