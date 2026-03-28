<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ContractsExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $contracts) {}

    public function collection(): Collection
    {
        return $this->contracts->map(fn ($contract) => [
            'contract_number' => $contract->contract_number,
            'client' => $contract->client?->company_name,
            'title' => $contract->contract_title,
            'project_name' => $contract->project_name,
            'contract_date' => $contract->contract_date?->format('Y-m-d'),
            'start_date' => $contract->start_date?->format('Y-m-d'),
            'end_date' => $contract->end_date?->format('Y-m-d'),
            'contract_value' => $contract->contract_value,
            'status' => $contract->contract_status,
        ]);
    }

    public function headings(): array
    {
        return [
            'Contract Number',
            'Client',
            'Title',
            'Project Name',
            'Contract Date',
            'Start Date',
            'End Date',
            'Contract Value',
            'Status',
        ];
    }
}
