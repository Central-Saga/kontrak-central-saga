<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\ContractDocumentVersionController;
use App\Http\Controllers\Api\V1\DashboardSummaryController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PaymentProofController;
use App\Http\Controllers\Api\V1\PaymentTermController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProjectProgressController;
use App\Http\Controllers\Api\V1\ReminderController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use App\Models\Client;
use App\Services\ClientUserService;
use Database\Seeders\ModuleStarterSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'backend',
    ]);
});

// Temporary diagnostic endpoint. Returns the real exception from
// createOrUpdateClientUser without the APP_DEBUG=false wrapper.
// Remove once the portal-access 500 is diagnosed.
Route::post('/v1/diag/client-user', function (Request $request) {
    $data = $request->validate([
        'client_code' => ['required', 'string'],
        'company_name' => ['required', 'string'],
        'email' => ['nullable', 'string'],
        'status' => ['required', 'string'],
        'password' => ['required', 'string', 'min:8'],
    ]);

    try {
        $client = Client::create([
            'client_code' => $data['client_code'],
            'company_name' => $data['company_name'],
            'email' => $data['email'] ?? null,
            'status' => $data['status'],
            'portal_access_enabled' => true,
        ]);
        $result = app(ClientUserService::class)
            ->createOrUpdateClientUser($client, $data['password']);

        return response()->json(['ok' => true, 'user_id' => $result['user']->id]);
    } catch (Throwable $e) {
        return response()->json([
            'ok' => false,
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile().':'.$e->getLine(),
            'trace' => collect($e->getTrace())->take(15)->map(fn ($t) => ($t['file'] ?? '?').':'.($t['line'] ?? '?').' '.($t['class'] ?? '').($t['type'] ?? '').($t['function'] ?? ''))->all(),
        ], 500);
    }
});

// Temporary: run ModuleStarterSeeder to create missing roles/permissions.
// Remove once production DB is seeded.
Route::post('/v1/diag/seed-roles', function () {
    try {
        Artisan::call('db:seed', [
            '--class' => ModuleStarterSeeder::class,
            '--force' => true,
        ]);
        $output = Artisan::output();

        return response()->json(['ok' => true, 'output' => trim($output)]);
    } catch (Throwable $e) {
        return response()->json([
            'ok' => false,
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile().':'.$e->getLine(),
        ], 500);
    }
});

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('avatar', [AuthController::class, 'updateAvatar']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::put('password', [AuthController::class, 'updatePassword']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('user', function (Request $request) {
            return response()->json(['data' => $request->user()]);
        });

        Route::get('dashboard/summary', DashboardSummaryController::class)
            ->middleware('permission:view reporting dashboard');

        Route::get('activity-logs', ActivityLogController::class)
            ->middleware('permission:view activity logs');

        Route::prefix('exports')->middleware('permission:export reports')->group(function (): void {
            Route::get('contracts', [ExportController::class, 'contracts']);
            Route::get('payments', [ExportController::class, 'payments']);
            Route::get('project-progress', [ExportController::class, 'projectProgress']);
        });

        Route::prefix('exports')->group(function (): void {
            Route::get('users', [ExportController::class, 'users'])
                ->middleware('permission:export users');
            Route::get('roles', [ExportController::class, 'roles'])
                ->middleware('permission:export roles');
            Route::get('permissions', [ExportController::class, 'permissions'])
                ->middleware('permission:export permissions');
        });

        // Generate code routes MUST be before apiResource to avoid {id} conflict
        Route::get('clients/generate-code', [ClientController::class, 'generateCode'])
            ->middleware('permission:manage clients');

        Route::get('contracts/generate-code', [ContractController::class, 'generateCode'])
            ->middleware('permission:manage contracts');

        Route::apiResource('clients', ClientController::class)
            ->middleware('permission:manage clients');

        Route::apiResource('contracts', ContractController::class)
            ->middlewareFor(['index', 'show'], 'role_or_permission:manage contracts|read contracts')
            ->middlewareFor('store', 'role_or_permission:manage contracts|create contracts')
            ->middlewareFor('update', 'role_or_permission:manage contracts|update contracts')
            ->middlewareFor('destroy', 'role_or_permission:manage contracts|delete contracts');

        Route::prefix('contracts/{contract}')->group(function (): void {
            // Read-only document routes: allow client role with read contracts permission
            Route::middleware('role_or_permission:manage contracts|read contracts')->group(function (): void {
                Route::get('document-versions', [ContractDocumentVersionController::class, 'index']);
                Route::get('document-versions/compare', [ContractDocumentVersionController::class, 'compare']);
                Route::get('document-versions/compare-content', [ContractDocumentVersionController::class, 'compareContent']);
                Route::get('document-versions/history', [ContractDocumentVersionController::class, 'getHistory']);
                Route::get('document-versions/{version}', [ContractDocumentVersionController::class, 'show']);
                Route::get('document-versions/{version}/download', [ContractDocumentVersionController::class, 'download']);
                Route::get('document-versions/{version}/audit-logs', [ContractDocumentVersionController::class, 'getAuditLogs']);
            });

            // Write operations: only users who can manage contracts
            Route::middleware('permission:manage contracts')->group(function (): void {
                Route::post('document-versions', [ContractDocumentVersionController::class, 'store']);
            });
        });

        Route::apiResource('payment-terms', PaymentTermController::class)
            ->middlewareFor(['index', 'show'], 'role_or_permission:manage payment terms|read payment terms')
            ->middlewareFor('store', 'role_or_permission:manage payment terms|create payment terms')
            ->middlewareFor('update', 'role_or_permission:manage payment terms|update payment terms')
            ->middlewareFor('destroy', 'role_or_permission:manage payment terms|delete payment terms');

        Route::apiResource('payments', PaymentController::class)
            ->middlewareFor(['index', 'show'], 'role_or_permission:manage payments|read payments')
            ->middlewareFor('store', 'role_or_permission:manage payments|create payments')
            ->middlewareFor('update', 'role_or_permission:manage payments|update payments|verification payments')
            ->middlewareFor('destroy', 'role_or_permission:manage payments|delete payments');

        Route::post('payments/{payment}/proof', PaymentProofController::class)
            ->middleware('role_or_permission:client|manage payments|upload payment proofs|create payment proofs');

        Route::apiResource('project-progress', ProjectProgressController::class)
            ->middlewareFor(['index', 'show'], 'role_or_permission:manage project progress|read project progress')
            ->middlewareFor('store', 'role_or_permission:manage project progress|create project progress')
            ->middlewareFor('update', 'role_or_permission:manage project progress|update project progress')
            ->middlewareFor('destroy', 'role_or_permission:manage project progress|delete project progress');

        Route::post('payment-terms/{paymentTerm}/send-reminder', [ReminderController::class, 'sendPaymentTermReminder'])
            ->middleware('role_or_permission:manage payment terms|manage payments');

        Route::post('project-progress/{projectProgress}/send-reminder', [ReminderController::class, 'sendProjectProgressReminder'])
            ->middleware('role_or_permission:manage project progress');

        Route::middleware('role:admin')->group(function (): void {
            Route::apiResource('users', UserController::class)
                ->middlewareFor(['index', 'show'], 'permission:read users')
                ->middlewareFor('store', 'permission:create users')
                ->middlewareFor('update', 'permission:update users')
                ->middlewareFor('destroy', 'permission:delete users');

            Route::apiResource('roles', RoleController::class)
                ->middlewareFor(['index', 'show'], 'permission:read roles')
                ->middlewareFor('store', 'permission:create roles')
                ->middlewareFor('update', 'permission:update roles')
                ->middlewareFor('destroy', 'permission:delete roles');

            Route::apiResource('permissions', PermissionController::class)
                ->middlewareFor(['index', 'show'], 'permission:read permissions')
                ->middlewareFor(['store', 'update'], 'permission:update permissions')
                ->middlewareFor('destroy', 'permission:delete permissions');
        });
    });
});
