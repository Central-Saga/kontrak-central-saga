<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\ContractsExport;
use App\Exports\PaymentsExport;
use App\Exports\PermissionsExport;
use App\Exports\ProjectProgressExport;
use App\Exports\RolesExport;
use App\Exports\UsersExport;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\ProjectProgress;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function contracts(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $contracts = Contract::query()
            ->with('client:id,company_name')
            ->when($request->integer('client_id'), fn ($query, $clientId) => $query->where('client_id', $clientId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('contract_status', $status))
            ->orderBy('contract_number')
            ->get();

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'contracts-report',
            export: new ContractsExport($contracts),
            view: 'exports.contracts',
            data: [
                'title' => 'Contracts Report',
                'generatedAt' => now(),
                'records' => $contracts,
            ],
        );
    }

    public function payments(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $payments = Payment::query()
            ->with(['paymentTerm.contract:id,contract_number,project_name'])
            ->when($request->integer('payment_term_id'), fn ($query, $paymentTermId) => $query->where('payment_term_id', $paymentTermId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->latest('payment_date')
            ->get();

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'payments-report',
            export: new PaymentsExport($payments),
            view: 'exports.payments',
            data: [
                'title' => 'Payments Report',
                'generatedAt' => now(),
                'records' => $payments,
            ],
        );
    }

    public function projectProgress(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $progressUpdates = ProjectProgress::query()
            ->with('contract:id,contract_number,project_name')
            ->when($request->integer('contract_id'), fn ($query, $contractId) => $query->where('contract_id', $contractId))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->latest('progress_date')
            ->get();

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'project-progress-report',
            export: new ProjectProgressExport($progressUpdates),
            view: 'exports.project-progress',
            data: [
                'title' => 'Project Progress Report',
                'generatedAt' => now(),
                'records' => $progressUpdates,
            ],
        );
    }

    public function users(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $search = trim((string) $request->query('search'));
        $roleId = $request->integer('role_id');

        $users = User::query()
            ->with('roles:id,name,guard_name')
            ->withCount('roles')
            ->when($roleId, fn ($query, $id) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('id', $id)))
            ->when(
                $search,
                fn ($query, $term) => $query->where(function ($nestedQuery) use ($term): void {
                    $nestedQuery
                        ->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                }),
            )
            ->latest('id')
            ->get();

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'users-report',
            export: new UsersExport($users),
            view: 'exports.users',
            data: [
                'title' => 'Laporan Data Pengguna',
                'generatedAt' => now(),
                'records' => $users,
                'filters' => [
                    'search' => $search ?: null,
                    'role_id' => $roleId ?: null,
                ],
            ],
        );
    }

    public function roles(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $search = trim((string) $request->query('search'));
        $permissionId = $request->integer('permission_id');

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name,guard_name')
            ->withCount(['permissions'])
            ->when($permissionId, fn ($query, $id) => $query->whereHas('permissions', fn ($permissionQuery) => $permissionQuery->where('permissions.id', $id)))
            ->when($search, fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->latest('id')
            ->get();

        $this->appendRoleUserCounts($roles);

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'roles-report',
            export: new RolesExport($roles),
            view: 'exports.roles',
            data: [
                'title' => 'Laporan Data Peran',
                'generatedAt' => now(),
                'records' => $roles,
                'filters' => [
                    'search' => $search ?: null,
                    'permission_id' => $permissionId ?: null,
                ],
            ],
        );
    }

    private function appendRoleUserCounts(iterable $roles): void
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

    public function permissions(Request $request): Response|BinaryFileResponse|StreamedResponse
    {
        $search = trim((string) $request->query('search'));
        $action = trim((string) $request->query('action'));
        $module = trim((string) $request->query('module'));

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->with('roles:id,name,guard_name')
            ->withCount(['roles'])
            ->when($search, fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->when($action, fn ($query, $actionName) => $query->where('name', 'like', "{$actionName} %"))
            ->when($module, fn ($query, $moduleName) => $query->where('name', 'like', '% '.str_replace('_', ' ', $moduleName)))
            ->latest('id')
            ->get();

        return $this->exportResponse(
            format: $request->string('format')->toString() ?: 'pdf',
            fileBaseName: 'permissions-report',
            export: new PermissionsExport($permissions),
            view: 'exports.permissions',
            data: [
                'title' => 'Laporan Data Hak Akses',
                'generatedAt' => now(),
                'records' => $permissions,
                'filters' => [
                    'search' => $search ?: null,
                    'action' => $action ?: null,
                    'module' => $module ?: null,
                ],
            ],
        );
    }

    private function exportResponse(
        string $format,
        string $fileBaseName,
        object $export,
        string $view,
        array $data,
    ): Response|BinaryFileResponse|StreamedResponse {
        return match ($format) {
            'xlsx' => Excel::download($export, $fileBaseName.'.xlsx'),
            'csv' => Excel::download($export, $fileBaseName.'.csv', \Maatwebsite\Excel\Excel::CSV),
            default => Pdf::loadView($view, $data)
                ->setPaper('a4', 'portrait')
                ->download($fileBaseName.'.pdf'),
        };
    }
}
