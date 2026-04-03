<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractDocumentVersionResource extends JsonResource
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
            'media_id' => $this->media_id,
            'document_type' => $this->document_type,
            'version_number' => $this->version_number,
            'version_status' => $this->version_status,
            'original_file_name' => $this->original_file_name,
            'stored_file_name' => $this->stored_file_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'checksum_sha256' => $this->checksum_sha256,
            'change_summary' => $this->change_summary,
            'uploaded_at' => $this->uploaded_at?->toAtomString(),
            'uploaded_by' => $this->uploaded_by,
            'uploader' => $this->whenLoaded('uploader', fn (): array => [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
                'email' => $this->uploader->email,
            ]),
            'media' => $this->whenLoaded('media', fn (): array => [
                'id' => $this->media->id,
                'name' => $this->media->name,
                'file_name' => $this->media->file_name,
                'mime_type' => $this->media->mime_type,
                'size' => $this->media->size,
                'url' => $this->media->getUrl(),
            ]),
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
