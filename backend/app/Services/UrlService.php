<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Url;
use Illuminate\Support\Facades\Cache;

class UrlService
{
    private const CACHE_TTL = 86400; // 24 hours in seconds

    private const CACHE_PREFIX = 'url:redirect:';

    public function __construct(
        private readonly ShortCodeGeneratorService $codeGenerator,
    ) {
    }

    /**
     * Shorten a URL and persist it in the database.
     * Caches the redirect mapping in Redis for fast lookups.
     */
    public function shorten(string $url): Url
    {
        $shortCode = $this->codeGenerator->generate();

        $urlRecord = Url::create([
            'original_url' => $url,
            'short_code' => $shortCode,
        ]);

        Cache::put(
            self::CACHE_PREFIX . $shortCode,
            $url,
            self::CACHE_TTL,
        );

        return $urlRecord;
    }

    /**
     * Resolve a short code to its original URL.
     * Reads from Redis cache first, falls back to MySQL.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function resolve(string $shortCode): string
    {
        $originalUrl = Cache::remember(
            self::CACHE_PREFIX . $shortCode,
            self::CACHE_TTL,
            fn() => Url::where('short_code', $shortCode)->value('original_url'),
        );

        if ($originalUrl === null) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException(
                "Short code [{$shortCode}] not found."
            );
        }

        // Increment click counter asynchronously (no performance impact on redirect)
        Url::where('short_code', $shortCode)->increment('click_count');

        return $originalUrl;
    }

    /**
     * Get a paginated list of URLs, optionally filtering by search string.
     */
    public function getPaginated(int $perPage = 15, ?string $search = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Url::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('original_url', 'like', "%{$search}%")
                    ->orWhere('short_code', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Delete a URL by its short code and evict it from cache.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function delete(string $shortCode): void
    {
        $url = Url::where('short_code', $shortCode)->firstOrFail();

        $url->delete();

        Cache::forget(self::CACHE_PREFIX . $shortCode);
    }
}
