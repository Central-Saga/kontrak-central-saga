<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTermResource extends JsonResource
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
            'term_number' => $this->term_number,
            'term_title' => $this->term_title,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'amount' => $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'payable_after_condition' => $this->payable_after_condition,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
