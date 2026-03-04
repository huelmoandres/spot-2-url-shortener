<?php

declare(strict_types=1);

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Spot2 URL Shortener API",
 *     version="1.0.0",
 *     description="RESTful API for URL shortening. Spot2 FullStack IC technical challenge.",
 *
 *     @OA\Contact(
 *         email="dante@spot2.mx",
 *         name="Spot2 Tech Team"
 *     )
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Local server (Laravel Sail)"
 * )
 *
 * @OA\Tag(
 *     name="URLs",
 *     description="URL shortening and redirection operations"
 * )
 *
 * @OA\Schema(
 *     schema="ShortenedUrl",
 *     type="object",
 *     required={"short_code", "short_url", "original_url"},
 *
 *     @OA\Property(property="short_code",   type="string", example="aBc3mNp", description="Unique 7-character Base58 code"),
 *     @OA\Property(property="short_url",    type="string", example="http://localhost/aBc3mNp", description="Complete shortened URL ready to share"),
 *     @OA\Property(property="original_url", type="string", example="https://google.com/maps/restaurantes-cdmx", description="Submitted original URL")
 * )
 *
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *
 *     @OA\Property(property="message", type="string", example="The provided value is not a valid URL."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\Property(
 *             property="url",
 *             type="array",
 *
 *             @OA\Items(type="string", example="The provided value is not a valid URL.")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="NotFoundError",
 *     type="object",
 *
 *     @OA\Property(property="message", type="string", example="Short code [nope123] not found.")
 * )
 */
class SwaggerAnnotations {}
