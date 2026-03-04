<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Url extends Model
{
    /** @use HasFactory<\Database\Factories\UrlFactory> */
    use HasFactory;

    protected $fillable = [
        'original_url',
        'short_code',
        'click_count',
    ];

    protected $casts = [
        'click_count' => 'integer',
    ];
}
