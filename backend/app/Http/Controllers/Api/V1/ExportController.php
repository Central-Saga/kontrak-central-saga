<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\ContractsExport;
use App\Exports\PaymentsExport;
use App\Exports\ProjectProgressExport;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\ProjectProgress;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
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
