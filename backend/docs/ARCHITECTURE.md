# Backend Architecture — Spot2 URL Shortener

> **Stack:** Laravel 12 · PHP 8.2+ · MySQL 8.4 · Redis · Laravel Sail (Docker)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Layer Breakdown](#3-layer-breakdown)
4. [Design Decisions](#4-design-decisions)
5. [Short Code Generation](#5-short-code-generation)
6. [Cache Strategy](#6-cache-strategy)
7. [Security Model](#7-security-model)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Trade-offs & Future Work](#11-trade-offs--future-work)

---

## 1. System Overview

The backend is a stateless HTTP API. Its single responsibility is managing the mapping between long URLs and their 7-character short codes. All state lives in MySQL (persistent) and Redis (ephemeral cache).

```
Client (browser / React SPA)
        │
        ▼
   Nginx (port 80)
        │
        ▼
  Laravel (PHP-FPM)
        │
   ┌────┴────┐
   │         │
 MySQL     Redis
(source   (cache,
of truth)  24h TTL)
```

The redirect route (`GET /{shortCode}`) lives in `routes/web.php` — **not** in `routes/api.php` — so the short URL has no `/api/` prefix. This is an explicit product decision: a short URL like `http://s.pt/aBc3mNp` is usable by humans, not `http://s.pt/api/aBc3mNp`.

---

## 2. Request Lifecycle

### Shorten (`POST /api/shorten`)

```
Request → ShortenUrlRequest (validate: required, url, max:2048, regex:https?)
        → UrlController::shorten()
        → UrlService::shorten()
            ├── Url::where('original_url', $url)->first()   ← idempotency check
            │   └── [found] → Cache::put() refresh TTL → return existing
            └── [not found]
                → ShortCodeGeneratorService::generate()
                    └── for (0..MAX_ATTEMPTS):
                            random_int() Base58 × 7 chars
                            Url::exists() check
                            [unique] → return code
                        [exhausted] → RuntimeException
                → Url::create()
                → Cache::put('url:redirect:{code}', $url, 86400)
                → return Url model
        → JSON 201 {shortCode, shortUrl, originalUrl}
```

### Redirect (`GET /{shortCode}`)

```
Request → Route::where('shortCode', '[a-zA-Z0-9]{1,8}')  ← regex guard at route level
        → UrlController::redirect()
        → UrlService::resolve()
            → Cache::get('url:redirect:{code}')
                ├── [HIT]  → skip DB query entirely
                └── [MISS] → Url::where('short_code')->value('original_url')
                                 ├── [null] → throw ModelNotFoundException
                                 └── [found] → Cache::put() (only cache positive results)
            → Url::where()->increment('click_count')   ← atomic SQL UPDATE
            → return $originalUrl
        → redirect()->away($url, 302)
```

---

## 3. Layer Breakdown

| Layer | Class | Responsibility |
|-------|-------|----------------|
| **Route** | `routes/web.php`, `routes/api.php` | URL routing, regex constraints, throttle middleware |
| **Controller** | `UrlController` | HTTP in/out. Zero business logic. Catches exceptions → HTTP codes |
| **FormRequest** | `ShortenUrlRequest`, `GetUrlsQueryRequest` | Input validation, error message customization |
| **Service** | `UrlService` | Orchestrates DB + cache. Pure business logic |
| **Service** | `ShortCodeGeneratorService` | Isolated code generation. Testable independently |
| **Resource** | `UrlResource` | Serializes `Url` model to camelCase JSON |
| **Model** | `Url` | Eloquent ORM. Fillable + casts declared explicitly |

### Why two Services instead of one?

`ShortCodeGeneratorService` has a single, well-defined responsibility: generate a unique code. Keeping it separate means:
- It can be unit-tested in total isolation (no HTTP, no DB state needed for most tests).
- The generation algorithm can be swapped (e.g., ULID, NanoID) without touching `UrlService`.
- It follows the **Single Responsibility Principle** strictly.

---

## 4. Design Decisions

### 4.1 Idempotency in `shorten()`

**Decision:** if the same URL is submitted twice, return the same short code.

**Rationale:** in a real prop-tech context, agents share property URLs across teams. Creating a new code per request would pollute the database with duplicates and confuse analytics (click counts split across multiple codes for the same destination). Idempotency is the correct default.

**Implementation:** `Url::where('original_url', $url)->first()` before creating. Uses the database as the source of truth.

### 4.2 No `Cache::remember()` for redirects

**Decision:** use `Cache::get()` + manual `Cache::put()` instead of `Cache::remember()`.

**Rationale:** `Cache::remember()` caches the callback's return value unconditionally — including `null`. This creates a **cache poisoning** scenario:

```
1. GET /nonexistent-code  →  callback returns null  →  Cache stores null for 24h
2. POST /api/shorten generates that same code later
3. GET /that-code  →  Cache::remember returns null from cache  →  404
   (despite the URL existing in MySQL)
```

By caching only non-null results we avoid this entirely.

### 4.3 `redirect()->away()` vs `redirect()->to()`

`away()` bypasses Laravel's URL validation, which is necessary because the destination URL is external and arbitrary. `to()` would try to match internal routes.

### 4.4 Redirect lives in `web.php`, not `api.php`

Laravel's `api.php` automatically prefixes all routes with `/api`. Short URLs need to live at the root (`/{code}`). The web route group has no prefix, so it's the correct home for the redirect.

---

## 5. Short Code Generation

### Algorithm: Base58, 7 characters

```php
private const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// 57 characters — removes: 0 (zero), O (capital o), I (capital i), l (lowercase L), 1 (one)
```

**Why Base58?**
- **Readability:** eliminates visually ambiguous characters. A human reading `I1lO0` cannot tell which is which.
- **URL safety:** no characters that require percent-encoding.
- **Entropy:** 57⁷ ≈ 1.96 × 10¹² possible codes. At 1 million URLs/day, collisions become statistically significant only after ~4,400 years.

**Why `random_int()` and not `str_random()` or `Str::random()`?**
- `random_int()` uses the OS CSPRNG (`/dev/urandom` on Linux, `CryptGenRandom` on Windows).
- `Str::random()` uses `str_shuffle()` internally, which calls `mt_rand()` — a Mersenne Twister that is **not** cryptographically secure and whose output can be predicted if the seed is known.

**Collision guard:**

```php
for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
    $code = $this->generateRandom();
    if (!Url::where('short_code', $code)->exists()) {
        return $code;
    }
}
throw new RuntimeException('...');
```

`MAX_ATTEMPTS = 5`. The probability of 5 consecutive collisions given N existing URLs:

```
P(5 collisions) = (N / 57⁷)⁵
```

At 100 million URLs: P ≈ (100M / 1.96T)⁵ = (0.005%)⁵ ≈ 3 × 10⁻²⁷ — effectively impossible.

The `RuntimeException` is caught by the controller and returned as HTTP 503 to avoid an unhandled 500.

---

## 6. Cache Strategy

**Pattern:** Cache-Aside (lazy population)

```
Read:
  1. Check Redis key `url:redirect:{shortCode}`
  2. HIT  → return value (sub-millisecond)
  3. MISS → query MySQL → store in Redis (TTL 24h) → return value

Write:
  - On shorten()  → Cache::put() proactively warms the cache
  - On delete()   → Cache::forget() evicts the key immediately
  - Null results  → never cached (prevents cache poisoning)
```

**TTL: 24 hours**

Trade-off: a URL deleted via the API will still redirect for up to 24h if someone has a cached entry. Acceptable for a URL shortener context. For stricter consistency, use `Cache::forget()` on delete (already implemented) which reduces the window to 0 for API-initiated deletes.

**Cache key format:** `url:redirect:{shortCode}` — namespaced to avoid collisions with other cache entries if the Redis instance is shared.

**Why not cache `click_count`?**

Click counters need to be accurate for analytics. Batching counter updates in Redis and flushing to MySQL periodically is a valid optimization but adds complexity. For this scope, the `increment()` SQL query is atomic and fast enough.

---

## 7. Security Model

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Eloquent parameterized queries throughout. No raw SQL. |
| URL scheme injection (`ftp://`, `data://`) | `regex:/^https?:\/\//i` validation rule on `ShortenUrlRequest` |
| Brute-force enumeration of short codes | `throttle:60,1` on `POST /api/shorten`. Route regex `[a-zA-Z0-9]{1,8}` caps code length at the route level. |
| Denial of service on create endpoint | `throttle:60,1` per IP per minute |
| Mass deletion attack | `throttle:30,1` on `DELETE /api/urls/{shortCode}` |
| Database scraping | `throttle:120,1` on `GET /api/urls`. Pagination cap at 100 results per page. |
| Ambiguous code readability | Base58 alphabet excludes visually similar characters |
| Code collision exhaustion | Max 5 attempts, then 503 (not 500) |

**Not implemented (out of scope for this challenge):**
- Authentication / API keys
- HTTPS enforcement (assumed at reverse-proxy layer)
- Input sanitization beyond validation (not needed since output is a redirect, not rendered HTML)

---

## 8. Database Schema

```sql
CREATE TABLE urls (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    original_url  TEXT            NOT NULL,
    short_code    VARCHAR(8)      NOT NULL,
    click_count   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    TIMESTAMP       NULL,
    updated_at    TIMESTAMP       NULL,

    UNIQUE KEY urls_short_code_unique (short_code)
    -- The UNIQUE constraint serves dual purpose:
    -- 1. O(1) lookup by short_code (B-tree index)
    -- 2. DB-level collision guard (prevents race condition between
    --    exists() check and create() in high-concurrency scenarios)
);
```

**Why `TEXT` for `original_url`?**

RFC 3986 doesn't define a maximum URL length. Browsers cap at ~2048 characters for practical reasons. `VARCHAR(2048)` would work but `TEXT` avoids silently truncating a valid URL on some MySQL configurations. The validation layer (`max:2048`) is the enforcement point.

**Why no index on `original_url` for idempotency lookup?**

`original_url` is a `TEXT` column. MySQL cannot create a standard B-tree index on unbounded `TEXT`. Options:
- Use a `VARCHAR(2048)` with a prefix index — loses full-value uniqueness.
- Add a `SHA256` hash column and index that — clean but adds a migration.
- Accept the full-table scan for the idempotency check (current approach).

At the scale of this challenge, the full scan is acceptable. For production, the SHA256 approach is recommended.

---

## 9. API Reference

Interactive docs available at `http://localhost/api/documentation` (L5-Swagger).

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/shorten` | — | 60/min | Create or retrieve a short URL (idempotent) |
| `GET` | `/api/urls` | — | 120/min | List all URLs (paginated, filterable) |
| `DELETE` | `/api/urls/{shortCode}` | — | 30/min | Delete a short URL and evict cache |
| `GET` | `/{shortCode}` | — | — | Redirect to original URL (HTTP 302) |
| `GET` | `/` | — | — | Redirect to frontend (`APP_FRONTEND_URL`) |

### Response shapes

**`POST /api/shorten` → 201**
```json
{
  "shortCode": "aBc3mNp",
  "shortUrl": "http://localhost/aBc3mNp",
  "originalUrl": "https://spot2.mx/propiedades/oficina-en-renta"
}
```

**`GET /api/urls` → 200**
```json
{
  "data": [
    {
      "id": 1,
      "originalUrl": "https://spot2.mx/propiedades/oficina-en-renta",
      "shortCode": "aBc3mNp",
      "shortUrl": "http://localhost/aBc3mNp",
      "clickCount": 42,
      "createdAt": "2026-03-04T12:00:00.000000Z",
      "updatedAt": "2026-03-04T18:30:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42,
    "from": 1,
    "to": 15
  },
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}
```

**Errors**

| Status | Scenario | Body |
|--------|----------|------|
| 422 | Validation failed | `{ "message": "...", "errors": { "url": ["..."] } }` |
| 404 | Short code not found | `{ "message": "Short code [xyz] not found." }` |
| 429 | Rate limit exceeded | `{ "message": "Too Many Attempts." }` |
| 503 | Code generation exhausted | `{ "message": "Could not generate a unique short code. Please try again." }` |

---

## 10. CI/CD Pipeline

Two GitHub Actions workflows run on every push to `main` and on pull requests:

### Backend CI (`.github/workflows/backend-ci.yml`)

```
push/PR → backend/**
│
├── job: tests (matrix: PHP 8.2, 8.3, 8.4, 8.5)
│   ├── services: MySQL 8.4 + Redis Alpine
│   ├── composer install (cached by php-version + composer.lock hash)
│   ├── php artisan key:generate
│   ├── php artisan migrate
│   └── php artisan test --stop-on-failure
│       └── 25 tests / 606 assertions
│
└── job: lint
    ├── composer install (cached)
    └── ./vendor/bin/pint --test
```

### Frontend CI (`.github/workflows/frontend.yml`)

```
push/PR → frontend/**
│
└── job: build-and-lint
    ├── npm ci (cached by package-lock.json)
    ├── npm run lint   (ESLint)
    └── npm run build  (tsc -b && vite build)
```

---

## 11. Trade-offs & Future Work

| Area | Current approach | Production-grade alternative |
|------|-----------------|------------------------------|
| **Idempotency lookup** | Full table scan on `original_url TEXT` | Add `url_hash VARCHAR(64)` (SHA-256) with UNIQUE index |
| **Click counting** | Synchronous `increment()` on every redirect | Queue a `RecordClick` job; batch-flush to DB every N seconds |
| **Cache TTL** | Fixed 24h | Sliding TTL: reset on each hit; evict LRU entries |
| **Auth** | None (public API) | API keys with per-key rate limits |
| **Search** | `LIKE "%term%"` (no index) | Meilisearch / Typesense full-text index |
| **Short code entropy** | 57⁷ ≈ 1.96T | Increase to 8 chars → 57⁸ ≈ 111T if DB > 10M rows |
| **Redirect code** | HTTP 302 (temporary) | HTTP 301 (permanent) for SEO; browser-cached, no server hit |
