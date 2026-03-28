<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Contract;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-2 months', '+1 month');
        $endDate = (clone $startDate)->modify('+'.fake()->numberBetween(30, 180).' days');

        return [
            'client_id' => Client::factory(),
            'contract_number' => fake()->unique()->bothify('KCS-2026-###'),
            'contract_title' => 'Kontrak '.fake()->bs(),
            'project_name' => fake()->catchPhrase(),
            'contract_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'contract_value' => fake()->randomFloat(2, 50_000_000, 500_000_000),
            'project_scope' => fake()->paragraphs(2, true),
            'payment_scheme_summary' => fake()->randomElement(['40%-30%-30%', '50%-50%', '30%-40%-30%']),
            'contract_status' => fake()->randomElement(Contract::STATUSES),
            'notes' => fake()->optional()->sentence(),
            'created_by' => null,
            'updated_by' => null,
        ];
    }
}
