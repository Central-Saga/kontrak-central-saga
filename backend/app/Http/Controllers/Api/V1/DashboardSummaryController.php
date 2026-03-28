<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardSummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $today = Carbon::today();

        return response()->json([
            'data' => [
                'clients' => [
                    'total' => Client::count(),
                    'active' => Client::where('status', 'active')->count(),
                ],
                'contracts' => [
                    'total' => Contract::count(),
                    'active' => Contract::where('contract_status', 'active')->count(),
                    'completed' => Contract::where('contract_status', 'completed')->count(),
                    'total_value' => Contract::sum('contract_value'),
                ],
                'payment_terms' => [
                    'total' => PaymentTerm::count(),
                    'pending_review' => PaymentTerm::whereIn('status', ['pending', 'upcoming'])->count(),
                    'paid' => PaymentTerm::where('status', 'paid')->count(),
                    'overdue' => PaymentTerm::whereDate('due_date', '<', $today)
                        ->whereNotIn('status', ['paid', 'cancelled'])
                        ->count(),
                ],
                'payments' => [
                    'total' => Payment::count(),
                    'verified' => Payment::where('status', 'verified')->count(),
                    'pending_review' => Payment::where('status', 'pending_review')->count(),
                    'rejected' => Payment::where('status', 'rejected')->count(),
                ],
                'project_progress' => [
                    'total_updates' => ProjectProgress::count(),
                    'in_progress' => ProjectProgress::where('status', 'in_progress')->count(),
                    'delayed' => ProjectProgress::where('status', 'delayed')->count(),
                    'completed' => ProjectProgress::where('status', 'completed')->count(),
                ],
            ],
        ]);
    }
}
