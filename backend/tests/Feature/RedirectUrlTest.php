<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Url;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RedirectUrlTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_redirects_to_the_original_url_with_302(): void
    {
        $url = Url::factory()->create([
            'original_url' => 'https://www.google.com',
            'short_code' => 'abc1234',
        ]);

        // Short URL lives at /{shortCode} — NOT /api/{shortCode}
        $response = $this->get("/{$url->short_code}");

        $response->assertStatus(302)
            ->assertRedirect('https://www.google.com');
    }

    #[Test]
    public function it_returns_404_for_nonexistent_short_code(): void
    {
        $response = $this->getJson('/nope123');

        $response->assertStatus(404)
            ->assertJsonFragment(['message' => 'Short code [nope123] not found.']);
    }

    #[Test]
    public function it_increments_click_count_on_redirect(): void
    {
        $url = Url::factory()->create([
            'original_url' => 'https://example.com',
            'short_code' => 'xyz9876',
            'click_count' => 0,
        ]);

        $this->get("/{$url->short_code}");

        $this->assertDatabaseHas('urls', [
            'short_code' => 'xyz9876',
            'click_count' => 1,
        ]);
    }

    #[Test]
    public function it_increments_click_count_each_visit(): void
    {
        $url = Url::factory()->create([
            'original_url' => 'https://example.com',
            'short_code' => 'abcdefg',
            'click_count' => 0,
        ]);

        $this->get("/{$url->short_code}");
        $this->get("/{$url->short_code}");
        $this->get("/{$url->short_code}");

        $this->assertDatabaseHas('urls', [
            'short_code' => 'abcdefg',
            'click_count' => 3,
        ]);
    }

    #[Test]
    public function it_returns_a_short_url_without_api_prefix(): void
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://spot2.mx/propiedades/oficina-en-renta/ciudad-de-mexico',
        ]);

        $shortUrl = $response->json('short_url');

        // The short_url must NOT contain /api/ — it should be at root
        $this->assertStringNotContainsString('/api/', $shortUrl);
    }
}
