<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProjectProgressExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $progressUpdates) {}

    public function collection(): Collection
    {
        return $this->progressUpdates->map(fn ($progress) => [
            'contract_number' => $progress->contract?->contract_number,
            'project_name' => $progress->contract?->project_name,
            'progress_date' => $progress->progress_date?->format('Y-m-d'),
            'progress_title' => $progress->progress_title,
            'percentage' => $progress->percentage,
            'status' => $progress->status,
            'milestone_reference' => $progress->milestone_reference,
        ]);
    }

    public function headings(): array
    {
        return [
            'Contract Number',
            'Project Name',
            'Progress Date',
            'Progress Title',
            'Percentage',
            'Status',
            'Milestone Reference',
        ];
    }
}
