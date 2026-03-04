<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Url;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DeleteUrlTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_deletes_a_url_and_clears_cache_successfully(): void
    {
        $url = Url::factory()->create(['short_code' => 'aBcDeF']);

        $cacheKey = "url:redirect:{$url->short_code}";
        Cache::put($cacheKey, $url->original_url, 86400);

        $response = $this->deleteJson("/api/urls/{$url->short_code}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('urls', ['short_code' => 'aBcDeF']);
        $this->assertNull(Cache::get($cacheKey));
    }

    #[Test]
    public function it_returns_404_when_deleting_non_existent_short_code(): void
    {
        $response = $this->deleteJson('/api/urls/invalid1');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Short code [invalid1] not found.']);
    }
}
