<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use App\Models\User;
use App\Support\OperationalDataAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardSummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $today = Carbon::today();

        $clientsQuery = Client::query();
        $contractsQuery = Contract::query();
        $paymentTermsQuery = PaymentTerm::query();
        $paymentsQuery = Payment::query();
        $projectProgressQuery = ProjectProgress::query();

        OperationalDataAccess::scopeClients($clientsQuery, $user);
        OperationalDataAccess::scopeContracts($contractsQuery, $user);
        OperationalDataAccess::scopePaymentTerms($paymentTermsQuery, $user);
        OperationalDataAccess::scopePayments($paymentsQuery, $user);
        OperationalDataAccess::scopeProjectProgress($projectProgressQuery, $user);

        return response()->json([
            'data' => [
                'clients' => [
                    'total' => (clone $clientsQuery)->count(),
                    'active' => (clone $clientsQuery)->where('status', 'active')->count(),
                ],
                'contracts' => [
                    'total' => (clone $contractsQuery)->count(),
                    'active' => (clone $contractsQuery)->where('contract_status', 'active')->count(),
                    'completed' => (clone $contractsQuery)->where('contract_status', 'completed')->count(),
                    'total_value' => (clone $contractsQuery)->sum('contract_value'),
                ],
                'payment_terms' => [
                    'total' => (clone $paymentTermsQuery)->count(),
                    'pending_review' => (clone $paymentTermsQuery)->whereIn('status', ['pending', 'upcoming'])->count(),
                    'paid' => (clone $paymentTermsQuery)->where('status', 'paid')->count(),
                    'overdue' => (clone $paymentTermsQuery)->whereDate('due_date', '<', $today)
                        ->whereNotIn('status', ['paid', 'cancelled'])
                        ->count(),
                ],
                'payments' => [
                    'total' => (clone $paymentsQuery)->count(),
                    'verified' => (clone $paymentsQuery)->where('status', 'verified')->count(),
                    'pending_review' => (clone $paymentsQuery)->where('status', 'pending_review')->count(),
                    'rejected' => (clone $paymentsQuery)->where('status', 'rejected')->count(),
                ],
                'project_progress' => [
                    'total_updates' => (clone $projectProgressQuery)->count(),
                    'in_progress' => (clone $projectProgressQuery)->where('status', 'in_progress')->count(),
                    'delayed' => (clone $projectProgressQuery)->where('status', 'delayed')->count(),
                    'completed' => (clone $projectProgressQuery)->where('status', 'completed')->count(),
                ],
            ],
        ]);
    }
}
