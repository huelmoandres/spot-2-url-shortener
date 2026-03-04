<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a composite index on (created_at, id) to optimise the listing query:
 *
 *   SELECT ... FROM urls ORDER BY created_at DESC, id DESC LIMIT n OFFSET m
 *
 * Without this index, MySQL performs a full-table filesort on every paginated
 * request.  With it, the engine walks the B-tree in reverse order and stops
 * after reading exactly `n` rows — O(log N + n) instead of O(N log N).
 *
 * Why composite (created_at, id) and not just (created_at)?
 * - `created_at` has low cardinality for bulk imports (many rows share the
 *   same second-level timestamp). Adding `id` as a tie-breaker gives the
 *   index enough selectivity for stable keyset pagination and avoids
 *   inconsistent ordering across pages.
 * - The index also covers the COUNT(*) emitted by paginate() when no
 *   WHERE clause is present, because InnoDB can satisfy COUNT(*) by
 *   scanning the smallest available index rather than the clustered PK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('urls', function (Blueprint $table): void {
            // Composite index for: ORDER BY created_at DESC, id DESC
            $table->index(['created_at', 'id'], 'urls_created_at_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('urls', function (Blueprint $table): void {
            $table->dropIndex('urls_created_at_id_index');
        });
    }
};
