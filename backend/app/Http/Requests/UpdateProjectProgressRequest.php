<?php

namespace App\Http\Requests;

use App\Models\ProjectProgress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectProgressRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'contract_id' => ['sometimes', 'required', 'integer', 'exists:contracts,id'],
            'progress_date' => ['sometimes', 'required', 'date'],
            'progress_title' => ['sometimes', 'required', 'string', 'max:255'],
            'progress_description' => ['sometimes', 'required', 'string'],
            'percentage' => ['sometimes', 'required', 'integer', 'between:0,100'],
            'status' => ['sometimes', 'required', 'string', Rule::in(ProjectProgress::STATUSES)],
            'milestone_reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
