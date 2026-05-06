<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectProgressResource;
use App\Http\Requests\StoreProjectProgressRequest;
use App\Http\Requests\UpdateProjectProgressRequest;
use App\Models\Contract;
use App\Models\ProjectProgress;
use App\Models\User;
use App\Support\OperationalDataAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectProgressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $progressUpdatesQuery = ProjectProgress::query()
            ->with(['contract:id,client_id,contract_number,contract_title']);

        OperationalDataAccess::scopeProjectProgress($progressUpdatesQuery, $user);

        $progressUpdates = $progressUpdatesQuery
            ->when($request->integer('contract_id'), fn ($query, $contractId) => $query->where('contract_id', $contractId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->latest('progress_date')
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return ProjectProgressResource::collection($progressUpdates);
    }

    public function store(StoreProjectProgressRequest $request): ProjectProgressResource|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $contract = Contract::query()->findOrFail($data['contract_id']);

        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $projectProgress = ProjectProgress::create($data);

        return (new ProjectProgressResource($projectProgress->load('contract:id,client_id,contract_number,contract_title')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, ProjectProgress $projectProgress): ProjectProgressResource
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessProjectProgress($projectProgress, $user), 403);

        return new ProjectProgressResource($projectProgress->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function update(UpdateProjectProgressRequest $request, ProjectProgress $projectProgress): ProjectProgressResource
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $contract = Contract::query()->findOrFail($data['contract_id']);

        abort_unless(OperationalDataAccess::canAccessProjectProgress($projectProgress, $user), 403);
        abort_unless(OperationalDataAccess::canAccessContract($contract, $user), 403);

        $projectProgress->update($data);

        return new ProjectProgressResource($projectProgress->fresh()->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function destroy(Request $request, ProjectProgress $projectProgress): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(OperationalDataAccess::canAccessProjectProgress($projectProgress, $user), 403);

        $projectProgress->delete();

        return response()->json([], 204);
    }
}
