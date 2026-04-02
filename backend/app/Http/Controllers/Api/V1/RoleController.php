<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected function appendUserCounts(iterable $roles): void
    {
        $roleIds = collect($roles)
            ->pluck('id')
            ->filter()
            ->values();

        if ($roleIds->isEmpty()) {
            return;
        }

        $counts = DB::table('model_has_roles')
            ->selectRaw('role_id, COUNT(*) as aggregate')
            ->where('model_type', User::class)
            ->whereIn('role_id', $roleIds)
            ->groupBy('role_id')
            ->pluck('aggregate', 'role_id');

        foreach ($roles as $role) {
            $role->setAttribute('users_count', (int) ($counts[$role->id] ?? 0));
        }
    }

    protected function ensureWebRole(Role $role): void
    {
        abort_if($role->guard_name !== 'web', 404);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name,guard_name')
            ->withCount(['permissions'])
            ->when($request->integer('permission_id'), fn ($query, $permissionId) => $query->whereHas('permissions', fn ($permissionQuery) => $permissionQuery->where('permissions.id', $permissionId)))
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where('name', 'like', "%{$search}%"),
            )
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        $this->appendUserCounts($roles->getCollection());

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

        $role = $role->load('permissions:id,name,guard_name')->loadCount(['permissions']);
        $this->appendUserCounts([$role]);

        return (new RoleResource($role))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Role $role): RoleResource
    {
        $this->ensureWebRole($role);

        $role = $role->load('permissions:id,name,guard_name')->loadCount(['permissions']);
        $this->appendUserCounts([$role]);

        return new RoleResource($role);
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

        $role = $role->fresh()->load('permissions:id,name,guard_name')->loadCount(['permissions']);
        $this->appendUserCounts([$role]);

        return new RoleResource($role);
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->ensureWebRole($role);

        $hasUsers = DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->where('model_type', User::class)
            ->exists();

        if ($hasUsers) {
            return response()->json([
                'message' => 'Role with related users cannot be deleted.',
            ], 409);
        }

        $role->delete();

        return response()->json([], 204);
    }
}
