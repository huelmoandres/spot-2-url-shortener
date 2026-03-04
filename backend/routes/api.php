<?php

declare(strict_types=1);

use App\Http\Controllers\UrlController;
use Illuminate\Support\Facades\Route;

// POST /api/shorten — Create a short URL
Route::post('/shorten', [UrlController::class, 'shorten'])
    ->middleware('throttle:60,1');
