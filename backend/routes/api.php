<?php

declare(strict_types=1);

use App\Http\Controllers\UrlController;
use Illuminate\Support\Facades\Route;

// POST /api/shorten — Crear un enlace corto (60 req/min por IP)
Route::post('/shorten', [UrlController::class, 'shorten'])
    ->middleware('throttle:60,1');

// GET /api/urls — Listar enlaces paginados (120 req/min por IP)
// Límite más generoso que el de escritura, pero protegido contra scraping masivo.
Route::get('/urls', [UrlController::class, 'index'])
    ->middleware('throttle:120,1');

// DELETE /api/urls/{shortCode} — Eliminar un enlace (30 req/min por IP)
// Límite más estricto para proteger contra borrado masivo automatizado.
Route::delete('/urls/{shortCode}', [UrlController::class, 'destroy'])
    ->middleware('throttle:30,1');
