<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Url;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Url>
 */
class UrlFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'original_url' => $this->faker->url(),
            'short_code' => $this->faker->regexify('[a-zA-Z2-9]{7}'),
            'click_count' => $this->faker->numberBetween(0, 1000),
        ];
    }
}
