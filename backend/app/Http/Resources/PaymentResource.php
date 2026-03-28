<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'payment_term_id' => $this->payment_term_id,
            'payment_term' => $this->whenLoaded('paymentTerm', fn (): array => [
                'id' => $this->paymentTerm->id,
                'contract_id' => $this->paymentTerm->contract_id,
                'term_number' => $this->paymentTerm->term_number,
                'term_title' => $this->paymentTerm->term_title,
                'status' => $this->paymentTerm->status,
            ]),
            'payment_date' => $this->payment_date?->format('Y-m-d'),
            'amount' => $this->amount,
            'method' => $this->method,
            'status' => $this->status,
            'proof_files' => $this->getMedia('payment_proofs')->map(fn ($media): array => [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'url' => $media->getUrl(),
                'notes' => $media->getCustomProperty('notes'),
            ])->values(),
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
