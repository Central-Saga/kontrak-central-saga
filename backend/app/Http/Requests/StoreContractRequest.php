<?php

namespace App\Http\Requests;

use App\Models\Contract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContractRequest extends FormRequest
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
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'contract_number' => ['required', 'string', 'max:100', 'unique:contracts,contract_number'],
            'contract_title' => ['required', 'string', 'max:255'],
            'project_name' => ['required', 'string', 'max:255'],
            'contract_date' => ['required', 'date'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'contract_value' => ['required', 'numeric', 'min:0'],
            'project_scope' => ['required', 'string'],
            'payment_scheme_summary' => ['nullable', 'string'],
            'contract_status' => ['required', 'string', Rule::in(Contract::STATUSES)],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
