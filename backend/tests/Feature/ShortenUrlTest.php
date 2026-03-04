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
            ->assertJsonStructure(['shortCode', 'shortUrl', 'originalUrl']);

        $this->assertEquals(
            'https://www.google.com/maps/search/restaurantes+en+cdmx',
            $response->json('originalUrl')
        );
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
        $response = $this->postJson('/api/shorten', ['url' => 'https://example.com']);

        $this->assertLessThanOrEqual(8, strlen($response->json('shortCode')));
    }

    #[Test]
    public function it_returns_422_when_url_is_missing(): void
    {
        $this->postJson('/api/shorten', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_422_when_url_is_invalid(): void
    {
        $this->postJson('/api/shorten', ['url' => 'not-a-valid-url'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_422_when_url_is_too_long(): void
    {
        $longUrl = 'https://example.com/'.str_repeat('a', 2048);

        $this->postJson('/api/shorten', ['url' => $longUrl])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    #[Test]
    public function it_returns_422_for_non_http_schemes(): void
    {
        // La regla regex restringe a http y https; ftp y data son esquemas peligrosos.
        foreach (['ftp://example.com', 'data://text/plain,hello', 'javascript:alert(1)'] as $dangerousUrl) {
            $this->postJson('/api/shorten', ['url' => $dangerousUrl])
                ->assertStatus(422)
                ->assertJsonValidationErrors(['url']);
        }
    }

    #[Test]
    public function it_is_idempotent_and_returns_same_short_code_for_same_url(): void
    {
        $originalUrl = 'https://spot2.mx/propiedades/oficina-en-renta';

        $first = $this->postJson('/api/shorten', ['url' => $originalUrl]);
        $second = $this->postJson('/api/shorten', ['url' => $originalUrl]);

        // Ambas respuestas deben devolver el mismo código corto
        $this->assertSame($first->json('shortCode'), $second->json('shortCode'));

        // No debe haber registros duplicados en la base de datos
        $this->assertDatabaseCount('urls', 1);
    }

    #[Test]
    public function it_generates_different_short_codes_for_different_urls(): void
    {
        $first = $this->postJson('/api/shorten', ['url' => 'https://example.com/first']);
        $second = $this->postJson('/api/shorten', ['url' => 'https://example.com/second']);

        $this->assertNotSame($first->json('shortCode'), $second->json('shortCode'));
    }
}
