<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected function ensureWebRole(Role $role): void
    {
        abort_if($role->guard_name !== 'web', 404);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name,guard_name')
            ->withCount(['users', 'permissions'])
            ->when($request->integer('permission_id'), fn ($query, $permissionId) => $query->whereHas('permissions', fn ($permissionQuery) => $permissionQuery->where('permissions.id', $permissionId)))
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where('name', 'like', "%{$search}%"),
            )
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return RoleResource::collection($roles);
    }

    public function store(StoreRoleRequest $request): RoleResource|JsonResponse
    {
        $validated = $request->validated();
        $permissionIds = $validated['permission_ids'] ?? null;

        unset($validated['permission_ids']);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (is_array($permissionIds)) {
            $role->syncPermissions($permissionIds);
        }

        return (new RoleResource($role->load('permissions:id,name,guard_name')->loadCount(['users', 'permissions'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Role $role): RoleResource
    {
        $this->ensureWebRole($role);

        return new RoleResource($role->load('permissions:id,name,guard_name')->loadCount(['users', 'permissions']));
    }

    public function update(UpdateRoleRequest $request, Role $role): RoleResource
    {
        $this->ensureWebRole($role);

        $validated = $request->validated();
        $permissionIds = $validated['permission_ids'] ?? null;

        if (isset($validated['name'])) {
            $role->update([
                'name' => $validated['name'],
                'guard_name' => 'web',
            ]);
        }

        if (is_array($permissionIds)) {
            $role->syncPermissions($permissionIds);
        }

        return new RoleResource($role->fresh()->load('permissions:id,name,guard_name')->loadCount(['users', 'permissions']));
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->ensureWebRole($role);

        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Role with related users cannot be deleted.',
            ], 409);
        }

        $role->delete();

        return response()->json([], 204);
    }
}
