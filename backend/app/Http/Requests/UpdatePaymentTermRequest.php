<?php

namespace App\Http\Requests;

use App\Models\PaymentTerm;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentTermRequest extends FormRequest
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
        /** @var PaymentTerm $paymentTerm */
        $paymentTerm = $this->route('payment_term');

        return [
            'contract_id' => ['sometimes', 'required', 'integer', 'exists:contracts,id'],
            'term_number' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                Rule::unique('payment_terms', 'term_number')
                    ->ignore($paymentTerm->id)
                    ->where(
                        fn (Builder $query): Builder => $query->where('contract_id', $this->integer('contract_id', $paymentTerm->contract_id)),
                    ),
            ],
            'term_title' => ['sometimes', 'required', 'string', 'max:255'],
            'due_date' => ['sometimes', 'required', 'date'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', Rule::in(PaymentTerm::STATUSES)],
            'payable_after_condition' => ['nullable', 'string', 'max:255'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
