<?php

declare(strict_types=1);

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Spot2 URL Shortener API",
 *     version="1.0.0",
 *     description="API RESTful para acortar URLs. Desafío técnico Spot2 IC FullStack.",
 *     @OA\Contact(
 *         email="dante@spot2.mx",
 *         name="Spot2 Tech Team"
 *     )
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Servidor local (Laravel Sail)"
 * )
 *
 * @OA\Tag(
 *     name="URLs",
 *     description="Operaciones de acortamiento y redirección de URLs"
 * )
 *
 * @OA\Schema(
 *     schema="ShortenedUrl",
 *     type="object",
 *     required={"short_code", "short_url", "original_url"},
 *     @OA\Property(property="short_code",   type="string", example="aBc3mNp", description="Código único de 7 caracteres Base58"),
 *     @OA\Property(property="short_url",    type="string", example="http://localhost/aBc3mNp", description="URL corta completa lista para compartir"),
 *     @OA\Property(property="original_url", type="string", example="https://google.com/maps/restaurantes-cdmx", description="URL original enviada")
 * )
 *
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="The provided value is not a valid URL."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\Property(
 *             property="url",
 *             type="array",
 *             @OA\Items(type="string", example="The provided value is not a valid URL.")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="NotFoundError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="Short code [nope123] not found.")
 * )
 */
class SwaggerAnnotations
{
}
