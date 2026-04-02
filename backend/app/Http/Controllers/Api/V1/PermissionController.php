<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    protected function ensureWebPermission(Permission $permission): void
    {
        abort_if($permission->guard_name !== 'web', 404);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->with('roles:id,name,guard_name')
            ->withCount(['roles'])
            ->when(
                trim((string) $request->query('search')),
                fn ($query, $search) => $query->where('name', 'like', "%{$search}%"),
            )
            ->when(
                trim((string) $request->query('action')),
                fn ($query, $action) => $query->where('name', 'like', "{$action} %"),
            )
            ->when(
                trim((string) $request->query('module')),
                fn ($query, $module) => $query->where('name', 'like', '% '.str_replace('_', ' ', $module)),
            )
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return PermissionResource::collection($permissions);
    }

    public function store(StorePermissionRequest $request): PermissionResource|JsonResponse
    {
        $permission = Permission::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        return (new PermissionResource($permission->loadCount(['roles'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Permission $permission): PermissionResource
    {
        $this->ensureWebPermission($permission);

        return new PermissionResource($permission->load('roles:id,name,guard_name')->loadCount(['roles']));
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): PermissionResource
    {
        $this->ensureWebPermission($permission);

        $permission->update([
            'name' => $request->validated('name', $permission->name),
            'guard_name' => 'web',
        ]);

        return new PermissionResource($permission->fresh()->load('roles:id,name,guard_name')->loadCount(['roles']));
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $this->ensureWebPermission($permission);

        $hasDirectUsers = DB::table('model_has_permissions')
            ->where('permission_id', $permission->id)
            ->where('model_type', User::class)
            ->exists();

        if ($permission->roles()->exists() || $hasDirectUsers) {
            return response()->json([
                'message' => 'Permission with related users or roles cannot be deleted.',
            ], 409);
        }

        $permission->delete();

        return response()->json([], 204);
    }
}
