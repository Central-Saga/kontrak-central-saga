<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\ProjectProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectProgress>
 */
class ProjectProgressFactory extends Factory
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
            'progress_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'progress_title' => 'Update progres '.fake()->numberBetween(1, 20),
            'progress_description' => fake()->paragraph(),
            'percentage' => fake()->numberBetween(0, 100),
            'status' => fake()->randomElement(ProjectProgress::STATUSES),
            'milestone_reference' => fake()->optional()->words(3, true),
            'notes' => fake()->optional()->sentence(),
            'updated_by' => null,
        ];
    }
}
