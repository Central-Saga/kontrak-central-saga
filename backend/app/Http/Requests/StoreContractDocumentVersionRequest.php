<?php

namespace App\Http\Requests;

use App\Models\Contract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreContractDocumentVersionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                File::types(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'])->max('20mb'),
            ],
            'document_type' => ['required', 'string', Rule::in(Contract::DOCUMENT_TYPES)],
            'version_status' => ['required', 'string', Rule::in(Contract::DOCUMENT_VERSION_STATUSES)],
            'change_summary' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
