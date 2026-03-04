<?php

declare(strict_types=1);

use App\Http\Controllers\UrlController;
use Illuminate\Support\Facades\Route;

// POST /api/shorten — Create a short URL
Route::post('/shorten', [UrlController::class, 'shorten'])
    ->middleware('throttle:60,1');

// GET /api/urls — List paginated short URLs
Route::get('/urls', [UrlController::class, 'index']);

// DELETE /api/urls/{shortCode} — Delete a short URL
Route::delete('/urls/{shortCode}', [UrlController::class, 'destroy']);
