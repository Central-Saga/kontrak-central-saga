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
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'backend',
    ]);
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
            ->middleware('permission:manage contracts');

        Route::prefix('contracts/{contract}')->middleware('permission:manage contracts')->group(function (): void {
            Route::get('document-versions', [ContractDocumentVersionController::class, 'index']);
            Route::post('document-versions', [ContractDocumentVersionController::class, 'store']);
            Route::get('document-versions/compare', [ContractDocumentVersionController::class, 'compare']);
            Route::get('document-versions/{version}', [ContractDocumentVersionController::class, 'show']);
            Route::get('document-versions/{version}/download', [ContractDocumentVersionController::class, 'download']);
        });

        Route::apiResource('payment-terms', PaymentTermController::class)
            ->middleware('permission:manage payment terms');

        Route::apiResource('payments', PaymentController::class)
            ->middleware('permission:manage payments');

        Route::post('payments/{payment}/proof', PaymentProofController::class)
            ->middleware('role_or_permission:client|manage payments|upload payment proofs');

        Route::apiResource('project-progress', ProjectProgressController::class)
            ->middleware('permission:manage project progress');

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
            ->middlewareFor('store', 'permission:create permissions')
            ->middlewareFor('update', 'permission:update permissions')
            ->middlewareFor('destroy', 'permission:delete permissions');
    });
});
