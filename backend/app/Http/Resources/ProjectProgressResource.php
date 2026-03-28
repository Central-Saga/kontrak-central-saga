<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectProgressResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'contract' => $this->whenLoaded('contract', fn (): array => [
                'id' => $this->contract->id,
                'contract_number' => $this->contract->contract_number,
                'contract_title' => $this->contract->contract_title,
                'client_id' => $this->contract->client_id,
            ]),
            'progress_date' => $this->progress_date?->format('Y-m-d'),
            'progress_title' => $this->progress_title,
            'progress_description' => $this->progress_description,
            'percentage' => $this->percentage,
            'status' => $this->status,
            'milestone_reference' => $this->milestone_reference,
            'notes' => $this->notes,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
