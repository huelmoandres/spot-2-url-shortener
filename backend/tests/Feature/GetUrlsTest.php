<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Url;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetUrlsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_paginated_urls(): void
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

    public function test_it_filters_urls_by_search_query(): void
    {
        Url::factory()->create(['original_url' => 'https://example.com/unique-post']);
        Url::factory()->create(['original_url' => 'https://example.com/another-post']);
        Url::factory()->create(['short_code' => 'uniquesh']);

        // Search by part of original_url
        $response = $this->getJson('/api/urls?search=unique-post');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('https://example.com/unique-post', $response->json('data.0.originalUrl'));

        // Search by short_code
        $response2 = $this->getJson('/api/urls?search=uniquesh');
        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data'));
        $this->assertEquals('uniquesh', $response2->json('data.0.shortCode'));
    }
}
