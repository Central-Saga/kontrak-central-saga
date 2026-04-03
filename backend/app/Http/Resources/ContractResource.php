<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
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
            'client_id' => $this->client_id,
            'client' => $this->whenLoaded('client', fn (): array => [
                'id' => $this->client->id,
                'client_code' => $this->client->client_code,
                'company_name' => $this->client->company_name,
            ]),
            'contract_number' => $this->contract_number,
            'contract_title' => $this->contract_title,
            'project_name' => $this->project_name,
            'contract_date' => $this->contract_date?->format('Y-m-d'),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'contract_value' => $this->contract_value,
            'project_scope' => $this->project_scope,
            'payment_scheme_summary' => $this->payment_scheme_summary,
            'contract_status' => $this->contract_status,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'payment_terms_count' => $this->whenCounted('paymentTerms'),
            'project_progress_updates_count' => $this->whenCounted('projectProgressUpdates'),
            'payment_terms' => PaymentTermResource::collection($this->whenLoaded('paymentTerms')),
            'project_progress' => ProjectProgressResource::collection($this->whenLoaded('projectProgressUpdates')),
            'document_versions' => ContractDocumentVersionResource::collection($this->whenLoaded('documentVersions')),
            'latest_progress' => $this->when(
                $this->relationLoaded('latestProgress') && $this->latestProgress !== null,
                fn () => new ProjectProgressResource($this->latestProgress),
            ),
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
