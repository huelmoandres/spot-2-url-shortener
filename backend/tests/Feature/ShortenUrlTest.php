<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ShortenUrlTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_shortens_a_valid_url_and_returns_201(): void
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://www.google.com/maps/search/restaurantes+en+cdmx',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'short_code',
                'short_url',
                'original_url',
            ]);
    }

    #[Test]
    public function it_stores_the_url_record_in_the_database(): void
    {
        $this->postJson('/api/shorten', [
            'url' => 'https://example.com/some/very/long/path?query=value',
        ]);

        $this->assertDatabaseCount('urls', 1);
        $this->assertDatabaseHas('urls', [
            'original_url' => 'https://example.com/some/very/long/path?query=value',
        ]);
    }

    #[Test]
    public function it_generates_a_short_code_of_at_most_eight_characters(): void
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com',
        ]);

        $shortCode = $response->json('short_code');

        $this->assertLessThanOrEqual(8, strlen($shortCode));
    }

    #[Test]
    public function it_returns_422_when_url_is_missing(): void
    {
        $response = $this->postJson('/api/shorten', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_422_when_url_is_not_valid(): void
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'not-a-valid-url',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_422_when_url_is_just_a_string_without_protocol(): void
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'google.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_the_original_url_in_the_response(): void
    {
        $originalUrl = 'https://spot2.mx/propiedades/oficina-en-renta';

        $response = $this->postJson('/api/shorten', ['url' => $originalUrl]);

        $response->assertJsonFragment(['original_url' => $originalUrl]);
    }

    #[Test]
    public function it_generates_different_short_codes_for_different_urls(): void
    {
        $first = $this->postJson('/api/shorten', ['url' => 'https://example.com/first']);
        $second = $this->postJson('/api/shorten', ['url' => 'https://example.com/second']);

        $this->assertNotSame(
            $first->json('short_code'),
            $second->json('short_code'),
        );
    }
}
