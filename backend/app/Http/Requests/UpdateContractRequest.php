<?php

namespace App\Http\Requests;

use App\Models\Contract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractRequest extends FormRequest
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
        /** @var Contract $contract */
        $contract = $this->route('contract');

        return [
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'contract_number' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('contracts', 'contract_number')->ignore($contract->id)],
            'contract_title' => ['sometimes', 'required', 'string', 'max:255'],
            'project_name' => ['sometimes', 'required', 'string', 'max:255'],
            'contract_date' => ['sometimes', 'required', 'date'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'contract_value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'project_scope' => ['sometimes', 'required', 'string'],
            'payment_scheme_summary' => ['nullable', 'string'],
            'contract_status' => ['sometimes', 'required', 'string', Rule::in(Contract::STATUSES)],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
