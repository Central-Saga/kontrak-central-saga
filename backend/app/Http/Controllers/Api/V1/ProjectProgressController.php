<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectProgressResource;
use App\Http\Requests\StoreProjectProgressRequest;
use App\Http\Requests\UpdateProjectProgressRequest;
use App\Models\ProjectProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectProgressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $progressUpdates = ProjectProgress::query()
            ->with(['contract:id,client_id,contract_number,contract_title'])
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
        $projectProgress = ProjectProgress::create($request->validated());

        return (new ProjectProgressResource($projectProgress->load('contract:id,client_id,contract_number,contract_title')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ProjectProgress $projectProgress): ProjectProgressResource
    {
        return new ProjectProgressResource($projectProgress->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function update(UpdateProjectProgressRequest $request, ProjectProgress $projectProgress): ProjectProgressResource
    {
        $projectProgress->update($request->validated());

        return new ProjectProgressResource($projectProgress->fresh()->load('contract:id,client_id,contract_number,contract_title'));
    }

    public function destroy(ProjectProgress $projectProgress): JsonResponse
    {
        $projectProgress->delete();

        return response()->json([], 204);
    }
}
