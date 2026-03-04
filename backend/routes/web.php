<?php

declare(strict_types=1);

use App\Http\Controllers\UrlController;
use Illuminate\Support\Facades\Route;

// Root: redirect to frontend
Route::get('/', function () {
    return redirect(config('app.frontend_url', 'http://localhost:5173'));
});

// Short URL redirect — /{shortCode}
// This lives in web.php so the short URL is at the root (e.g. http://localhost/aBcDeFg)
// NOT at /api/{shortCode}, which would pollute the short URL with a path prefix.
Route::get('/{shortCode}', [UrlController::class, 'redirect'])
    ->where('shortCode', '[a-zA-Z0-9]{1,8}');
