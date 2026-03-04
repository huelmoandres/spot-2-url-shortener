<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Url;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GetUrlsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_returns_paginated_urls(): void
    {
        Url::factory()->count(20)->create();

        $response = $this->getJson('/api/urls?per_page=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'originalUrl',
                        'shortCode',
                        'shortUrl',
                        'clickCount',
                        'createdAt',
                        'updatedAt',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
                'links',
            ]);

        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(20, $response->json('meta.total'));
    }

    #[Test]
    public function it_filters_urls_by_search_query(): void
    {
        Url::factory()->create(['original_url' => 'https://example.com/unique-post']);
        Url::factory()->create(['original_url' => 'https://example.com/another-post']);
        Url::factory()->create(['short_code' => 'uniquesh']);

        $response = $this->getJson('/api/urls?search=unique-post');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('https://example.com/unique-post', $response->json('data.0.originalUrl'));

        $response2 = $this->getJson('/api/urls?search=uniquesh');
        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data'));
        $this->assertEquals('uniquesh', $response2->json('data.0.shortCode'));
    }

    #[Test]
    public function it_returns_422_for_invalid_per_page(): void
    {
        $this->getJson('/api/urls?per_page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    #[Test]
    public function it_returns_422_when_per_page_exceeds_maximum(): void
    {
        $this->getJson('/api/urls?per_page=101')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    #[Test]
    public function it_returns_422_for_invalid_sort_value(): void
    {
        $this->getJson('/api/urls?sort=random')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sort']);
    }

    #[Test]
    public function it_sorts_newest_first_by_default(): void
    {
        $older = Url::factory()->create(['created_at' => now()->subMinutes(5)]);
        $newer = Url::factory()->create(['created_at' => now()]);

        $response = $this->getJson('/api/urls');

        $response->assertStatus(200);
        $this->assertEquals($newer->short_code, $response->json('data.0.shortCode'));
        $this->assertEquals($older->short_code, $response->json('data.1.shortCode'));
    }

    #[Test]
    public function it_sorts_oldest_first_when_requested(): void
    {
        $older = Url::factory()->create(['created_at' => now()->subMinutes(5)]);
        $newer = Url::factory()->create(['created_at' => now()]);

        $response = $this->getJson('/api/urls?sort=oldest');

        $response->assertStatus(200);
        $this->assertEquals($older->short_code, $response->json('data.0.shortCode'));
        $this->assertEquals($newer->short_code, $response->json('data.1.shortCode'));
    }

    #[Test]
    public function it_paginates_to_second_page_correctly(): void
    {
        Url::factory()->count(7)->create();

        $response = $this->getJson('/api/urls?per_page=5&page=2');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(2, $response->json('meta.current_page'));
        $this->assertEquals(2, $response->json('meta.last_page'));
        $this->assertEquals(7, $response->json('meta.total'));
    }
}
