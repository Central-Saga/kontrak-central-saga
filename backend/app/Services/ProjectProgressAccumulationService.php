<?php

namespace App\Services;

use App\Models\ProjectProgress;

class ProjectProgressAccumulationService
{
    public function recomputeForContract(int $contractId): void
    {
        $rows = ProjectProgress::where('contract_id', $contractId)
            ->orderBy('progress_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $running = 0;

        foreach ($rows as $row) {
            $running = min(100, $running + (int) $row->percentage);

            if ((int) $row->accumulated_percentage !== $running) {
                $row->update(['accumulated_percentage' => $running]);
            }
        }
    }
}
