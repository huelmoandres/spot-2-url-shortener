<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Url;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;

class UrlService
{
    private const CACHE_TTL = 86400; // 24 hours

    private const CACHE_PREFIX = 'url:redirect:';

    public function __construct(
        private readonly ShortCodeGeneratorService $codeGenerator,
    ) {}

    /**
     * Shortens a URL and persists it.
     *
     * Uses idempotent behavior to avoid duplicate short codes for the same URL.
     */
    public function shorten(string $url): Url
    {
        // Keep URL shortening idempotent by reusing existing records.
        $existing = Url::where('original_url', $url)->first();

        if ($existing !== null) {
            // Refresh cache TTL so hot links remain in Redis.
            Cache::put(self::CACHE_PREFIX.$existing->short_code, $url, self::CACHE_TTL);

            return $existing;
        }

        $shortCode = $this->codeGenerator->generate();

        $urlRecord = Url::create([
            'original_url' => $url,
            'short_code' => $shortCode,
        ]);

        Cache::put(self::CACHE_PREFIX.$shortCode, $url, self::CACHE_TTL);

        return $urlRecord;
    }

    /**
     * Resolves a short code to its original URL.
     *
     * Uses cache-aside and stores only successful lookups to avoid null-cache poisoning.
     *
     * @throws ModelNotFoundException
     */
    public function resolve(string $shortCode): string
    {
        $cacheKey = self::CACHE_PREFIX.$shortCode;

        $originalUrl = Cache::get($cacheKey);

        if ($originalUrl === null) {
            $originalUrl = Url::where('short_code', $shortCode)->value('original_url');

            if ($originalUrl === null) {
                throw new ModelNotFoundException("Short code [{$shortCode}] not found.");
            }

            // Cache only positive lookups to prevent stale null entries.
            Cache::put($cacheKey, $originalUrl, self::CACHE_TTL);
        }

        // increment() performs an atomic UPDATE: click_count = click_count + 1.
        Url::where('short_code', $shortCode)->increment('click_count');

        return $originalUrl;
    }

    /**
     * Returns a paginated URL list with optional filtering and sorting.
     *
     * Uses explicit column selection and stable ordering for predictable pagination.
     *
     * @param  positive-int  $perPage  Maximum 100 (validated in FormRequest)
     * @param  positive-int  $page  Explicit page number
     */
    public function getPaginated(
        int $perPage = 15,
        int $page = 1,
        ?string $search = null,
        string $sort = 'newest',
    ): LengthAwarePaginator {
        /** @var Builder<Url> $query */
        $query = Url::query()->select([
            'id',
            'original_url',
            'short_code',
            'click_count',
            'created_at',
            'updated_at',
        ]);

        if ($search !== null && $search !== '') {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('original_url', 'like', "%{$search}%")
                    ->orWhere('short_code', 'like', "%{$search}%");
            });
        }

        // Secondary sort by id keeps ordering stable for equal created_at values.
        $direction = $sort === 'oldest' ? 'asc' : 'desc';
        $query->orderBy('created_at', $direction)->orderBy('id', $direction);

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * Deletes a URL by short code and clears the cache entry.
     *
     * @throws ModelNotFoundException
     */
    public function delete(string $shortCode): void
    {
        $url = Url::where('short_code', $shortCode)->firstOrFail();

        $url->delete();

        Cache::forget(self::CACHE_PREFIX.$shortCode);
    }
}
