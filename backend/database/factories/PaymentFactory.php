<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\PaymentTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payment_term_id' => PaymentTerm::factory(),
            'payment_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'amount' => fake()->randomFloat(2, 10_000_000, 200_000_000),
            'method' => fake()->randomElement(['transfer', 'virtual_account', 'giro']),
            'status' => fake()->randomElement(Payment::STATUSES),
        ];
    }
}
