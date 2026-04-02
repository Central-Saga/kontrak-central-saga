<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->with('roles:id,name,guard_name')
            ->withCount('roles')
            ->when($request->integer('role_id'), fn ($query, $roleId) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('id', $roleId)))
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where(function ($nestedQuery) use ($search): void {
                    $nestedQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                }),
            )
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): UserResource|JsonResponse
    {
        $validated = $request->validated();
        $roleIds = $validated['role_ids'] ?? null;

        unset($validated['role_ids']);

        $user = User::create($validated);

        if (is_array($roleIds)) {
            $user->syncRoles($roleIds);
        }

        return (new UserResource($user->load('roles:id,name,guard_name')->loadCount('roles')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('roles:id,name,guard_name')->loadCount('roles'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $validated = $request->validated();
        $roleIds = $validated['role_ids'] ?? null;

        unset($validated['role_ids']);

        $user->update($validated);

        if (is_array($roleIds)) {
            $user->syncRoles($roleIds);
        }

        return new UserResource($user->fresh()->load('roles:id,name,guard_name')->loadCount('roles'));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([], 204);
    }
}
