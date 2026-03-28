<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\DashboardSummaryController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PaymentProofController;
use App\Http\Controllers\Api\V1\PaymentTermController;
use App\Http\Controllers\Api\V1\ProjectProgressController;
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

        Route::apiResource('clients', ClientController::class)
            ->middleware('permission:manage clients');

        Route::apiResource('contracts', ContractController::class)
            ->middleware('permission:manage contracts');

        Route::apiResource('payment-terms', PaymentTermController::class)
            ->middleware('permission:manage payment terms');

        Route::apiResource('payments', PaymentController::class)
            ->middleware('permission:manage payments');

        Route::post('payments/{payment}/proof', PaymentProofController::class)
            ->middleware('role_or_permission:client|manage payments|upload payment proofs');

        Route::apiResource('project-progress', ProjectProgressController::class)
            ->middleware('permission:manage project progress');
    });
});
