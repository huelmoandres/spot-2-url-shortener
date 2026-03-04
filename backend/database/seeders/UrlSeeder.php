<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Url;
use Illuminate\Database\Seeder;

class UrlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Url::factory()->count(10)->create();
    }
}
