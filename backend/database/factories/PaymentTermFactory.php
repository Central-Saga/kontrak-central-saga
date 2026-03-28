<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\PaymentTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentTerm>
 */
class PaymentTermFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contract_id' => Contract::factory(),
            'term_number' => fake()->numberBetween(1, 4),
            'term_title' => 'Termin '.fake()->numberBetween(1, 4),
            'due_date' => fake()->dateTimeBetween('now', '+4 months'),
            'amount' => fake()->randomFloat(2, 10_000_000, 200_000_000),
            'description' => fake()->sentence(),
            'status' => fake()->randomElement(PaymentTerm::STATUSES),
            'payable_after_condition' => fake()->optional()->sentence(4),
            'created_by' => null,
            'updated_by' => null,
        ];
    }
}
