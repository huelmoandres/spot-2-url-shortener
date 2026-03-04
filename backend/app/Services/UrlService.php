<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Url;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;

class UrlService
{
    private const CACHE_TTL = 86400; // 24 horas

    private const CACHE_PREFIX = 'url:redirect:';

    public function __construct(
        private readonly ShortCodeGeneratorService $codeGenerator,
    ) {}

    /**
     * Acorta una URL y la persiste en la base de datos.
     *
     * Implementa idempotencia: si la URL ya existe, devuelve el registro existente
     * en lugar de crear uno nuevo con un código distinto.
     * Cachea el mapeo en Redis para búsquedas rápidas.
     */
    public function shorten(string $url): Url
    {
        // Idempotencia: reutiliza el código corto si la URL ya fue acortada
        $existing = Url::where('original_url', $url)->first();

        if ($existing !== null) {
            // Refresca el TTL del caché por si expiró
            Cache::put(self::CACHE_PREFIX . $existing->short_code, $url, self::CACHE_TTL);

            return $existing;
        }

        $shortCode = $this->codeGenerator->generate();

        $urlRecord = Url::create([
            'original_url' => $url,
            'short_code'   => $shortCode,
        ]);

        Cache::put(self::CACHE_PREFIX . $shortCode, $url, self::CACHE_TTL);

        return $urlRecord;
    }

    /**
     * Resuelve un código corto a su URL original.
     *
     * Patrón Cache-Aside: lee de Redis primero, hace fallback a MySQL solo en
     * cache miss y únicamente cachea resultados positivos (no cachea 404s).
     *
     * NOTA: no se usa Cache::remember() porque éste almacena valores nulos,
     * lo que causaría cache poisoning: un código buscado antes de ser creado
     * quedaría cacheado como null durante el TTL completo.
     *
     * @throws ModelNotFoundException
     */
    public function resolve(string $shortCode): string
    {
        $cacheKey = self::CACHE_PREFIX . $shortCode;

        $originalUrl = Cache::get($cacheKey);

        if ($originalUrl === null) {
            $originalUrl = Url::where('short_code', $shortCode)->value('original_url');

            if ($originalUrl === null) {
                throw new ModelNotFoundException("Short code [{$shortCode}] not found.");
            }

            // Solo cacheamos cuando el resultado es positivo
            Cache::put($cacheKey, $originalUrl, self::CACHE_TTL);
        }

        // increment() emite un UPDATE atómico: `SET click_count = click_count + 1`
        Url::where('short_code', $shortCode)->increment('click_count');

        return $originalUrl;
    }

    /**
     * Devuelve una lista paginada de URLs, con filtrado opcional por texto.
     *
     * Nota de performance: la búsqueda con LIKE "%term%" no usa el índice de
     * short_code. Para producción a escala, considerar un índice FULLTEXT en
     * original_url o migrar la búsqueda a un motor de search (Meilisearch, Typesense).
     */
    public function getPaginated(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = Url::query();

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('original_url', 'like', "%{$search}%")
                    ->orWhere('short_code', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Elimina una URL por su código corto y limpia el caché.
     *
     * @throws ModelNotFoundException
     */
    public function delete(string $shortCode): void
    {
        $url = Url::where('short_code', $shortCode)->firstOrFail();

        $url->delete();

        Cache::forget(self::CACHE_PREFIX . $shortCode);
    }
}
