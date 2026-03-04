<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\GetUrlsQueryRequest;
use App\Http\Requests\ShortenUrlRequest;
use App\Http\Resources\UrlResource;
use App\Services\UrlService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

/**
 * @OA\Info(
 *     title="Spot2 URL Shortener API",
 *     version="1.0.0",
 *     description="API RESTful para acortar URLs. Desafío técnico Spot2 IC FullStack.",
 *
 *     @OA\Contact(name="Spot2 Tech Team", email="dante@spot2.mx")
 * )
 *
 * @OA\Server(url="http://localhost", description="Servidor local (Laravel Sail)")
 *
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *
 *     @OA\Property(property="message", type="string", example="The url field is required."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *
 *         @OA\Property(
 *             property="url",
 *             type="array",
 *
 *             @OA\Items(type="string", example="A URL is required.")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="NotFoundError",
 *     type="object",
 *
 *     @OA\Property(property="message", type="string", example="Short code [aBc3mNp] not found.")
 * )
 */
class UrlController extends Controller
{
    public function __construct(
        private readonly UrlService $urlService,
    ) {}

    /**
     * @OA\Get(
     *     path="/api/urls",
     *     tags={"URLs"},
     *     summary="Listar URLs",
     *     description="Devuelve una lista paginada de URLs acortadas. Permite filtrar por texto.",
     *     operationId="getUrls",
     *
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Lista paginada de URLs",
     *
     *         @OA\JsonContent(
     *             type="object",
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *
     *                 @OA\Items(
     *                     type="object",
     *
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="originalUrl", type="string", format="uri"),
     *                     @OA\Property(property="shortCode", type="string", example="aBc3mNp"),
     *                     @OA\Property(property="shortUrl", type="string", format="uri"),
     *                     @OA\Property(property="clickCount", type="integer"),
     *                     @OA\Property(property="createdAt", type="string", format="date-time"),
     *                     @OA\Property(property="updatedAt", type="string", format="date-time")
     *                 )
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *
     *                 @OA\Property(property="current_page", type="integer"),
     *                 @OA\Property(property="last_page", type="integer"),
     *                 @OA\Property(property="per_page", type="integer"),
     *                 @OA\Property(property="total", type="integer"),
     *                 @OA\Property(property="from", type="integer"),
     *                 @OA\Property(property="to", type="integer")
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(response=429, description="Rate limit excedido")
     * )
     */
    public function index(GetUrlsQueryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage   = (int) ($validated['per_page'] ?? 15);
        $search    = $validated['search'] ?? null;

        $paginator = $this->urlService->getPaginated($perPage, $search);

        return UrlResource::collection($paginator)->response();
    }

    /**
     * @OA\Delete(
     *     path="/api/urls/{shortCode}",
     *     tags={"URLs"},
     *     summary="Eliminar una URL acortada",
     *     description="Elimina una URL específica por su código corto y limpia el caché.",
     *     operationId="deleteUrl",
     *
     *     @OA\Parameter(
     *         name="shortCode",
     *         in="path",
     *         required=true,
     *         description="Código corto de la URL (1-8 caracteres alfanuméricos)",
     *
     *         @OA\Schema(type="string", example="aBc3mNp", pattern="^[a-zA-Z0-9]{1,8}$")
     *     ),
     *
     *     @OA\Response(response=204, description="URL eliminada exitosamente"),
     *     @OA\Response(response=404, description="Short code no encontrado", @OA\JsonContent(ref="#/components/schemas/NotFoundError")),
     *     @OA\Response(response=429, description="Rate limit excedido")
     * )
     */
    public function destroy(string $shortCode): JsonResponse
    {
        try {
            $this->urlService->delete($shortCode);

            return response()->json(null, 204);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => "Short code [{$shortCode}] not found.",
            ], 404);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/shorten",
     *     tags={"URLs"},
     *     summary="Acortar una URL",
     *     description="Recibe una URL larga y devuelve un código corto único de máximo 8 caracteres (Base58). Idempotente: la misma URL siempre devuelve el mismo código corto.",
     *     operationId="shortenUrl",
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"url"},
     *
     *             @OA\Property(
     *                 property="url",
     *                 type="string",
     *                 format="uri",
     *                 example="https://www.google.com/maps/search/restaurantes+en+cdmx",
     *                 description="URL válida con protocolo http o https, máximo 2048 caracteres."
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="URL acortada exitosamente",
     *
     *         @OA\JsonContent(
     *             type="object",
     *
     *             @OA\Property(property="shortCode", type="string", example="aBc3mNp"),
     *             @OA\Property(property="shortUrl", type="string", format="uri", example="http://localhost/aBc3mNp"),
     *             @OA\Property(property="originalUrl", type="string", format="uri", example="https://www.google.com/maps/search/restaurantes+en+cdmx")
     *         )
     *     ),
     *
     *     @OA\Response(response=422, description="URL inválida o faltante", @OA\JsonContent(ref="#/components/schemas/ValidationError")),
     *     @OA\Response(response=429, description="Rate limit excedido (60 req/min por IP)"),
     *     @OA\Response(response=503, description="No fue posible generar un código único. Reintentar.")
     * )
     */
    public function shorten(ShortenUrlRequest $request): JsonResponse
    {
        try {
            $url = $this->urlService->shorten($request->validated('url'));
        } catch (RuntimeException) {
            // El generador agotó MAX_ATTEMPTS sin encontrar un código disponible.
            // Extremadamente improbable (57^7 ≈ 1.3×10¹² combinaciones), pero lo
            // capturamos para evitar un 500 y orientar al cliente a reintentar.
            return response()->json([
                'message' => 'Could not generate a unique short code. Please try again.',
            ], 503);
        }

        return response()->json([
            'shortCode'   => $url->short_code,
            'shortUrl'    => url("/{$url->short_code}"),
            'originalUrl' => $url->original_url,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/{shortCode}",
     *     tags={"URLs"},
     *     summary="Redirigir a la URL original",
     *     description="Recibe un short code y redirige al usuario a la URL original con HTTP 302. Incrementa el contador de visitas.\n\n⚠️ **Nota:** No probable desde Swagger UI (el browser sigue el redirect). Usar `curl -v http://localhost/{shortCode}`.",
     *     operationId="redirectUrl",
     *
     *     @OA\Parameter(
     *         name="shortCode",
     *         in="path",
     *         required=true,
     *         description="Código corto de la URL (1-8 caracteres alfanuméricos)",
     *
     *         @OA\Schema(type="string", example="aBc3mNp", pattern="^[a-zA-Z0-9]{1,8}$")
     *     ),
     *
     *     @OA\Response(
     *         response=302,
     *         description="Redirección exitosa a la URL original",
     *
     *         @OA\Header(header="Location", description="URL original", @OA\Schema(type="string", format="uri"))
     *     ),
     *
     *     @OA\Response(response=404, description="Short code no encontrado", @OA\JsonContent(ref="#/components/schemas/NotFoundError"))
     * )
     */
    public function redirect(string $shortCode): RedirectResponse|JsonResponse
    {
        try {
            $originalUrl = $this->urlService->resolve($shortCode);

            return redirect()->away($originalUrl, 302);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => "Short code [{$shortCode}] not found.",
            ], 404);
        }
    }
}
