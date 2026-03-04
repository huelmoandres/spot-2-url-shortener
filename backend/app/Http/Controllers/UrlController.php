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

class UrlController extends Controller
{
    public function __construct(
        private readonly UrlService $urlService,
    ) {}

    /**
     * @OA\Get(
     *     path="/api/urls",
     *     tags={"URLs"},
     *     summary="List shortened URLs",
     *     description="Returns a paginated list of shortened URLs with optional text filtering.",
     *     operationId="getUrls",
     *
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Paginated URL list",
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
     *     @OA\Response(response=429, description="Rate limit exceeded")
     * )
     */
    public function index(GetUrlsQueryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $paginator = $this->urlService->getPaginated(
            perPage: (int) ($validated['per_page'] ?? 15),
            page: (int) ($validated['page'] ?? 1),
            search: $validated['search'] ?? null,
            sort: $validated['sort'] ?? 'newest',
        );

        return UrlResource::collection($paginator)->response();
    }

    /**
     * @OA\Delete(
     *     path="/api/urls/{shortCode}",
     *     tags={"URLs"},
     *     summary="Delete a shortened URL",
     *     description="Deletes a URL by short code and clears its cache entry.",
     *     operationId="deleteUrl",
     *
     *     @OA\Parameter(
     *         name="shortCode",
     *         in="path",
     *         required=true,
     *         description="URL short code (1-8 alphanumeric characters)",
     *
     *         @OA\Schema(type="string", example="aBc3mNp", pattern="^[a-zA-Z0-9]{1,8}$")
     *     ),
     *
     *     @OA\Response(response=204, description="URL deleted successfully"),
     *     @OA\Response(response=404, description="Short code not found", @OA\JsonContent(ref="#/components/schemas/NotFoundError")),
     *     @OA\Response(response=429, description="Rate limit exceeded")
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
     *     summary="Shorten a URL",
     *     description="Receives a long URL and returns a unique short code with up to 8 Base58 characters. Idempotent: the same URL always returns the same short code.",
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
     *                 description="Valid URL with http or https protocol, up to 2048 characters."
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="URL shortened successfully",
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
     *     @OA\Response(response=422, description="Missing or invalid URL", @OA\JsonContent(ref="#/components/schemas/ValidationError")),
     *     @OA\Response(response=429, description="Rate limit exceeded (60 req/min per IP)"),
     *     @OA\Response(response=503, description="Could not generate a unique code. Retry the request.")
     * )
     */
    public function shorten(ShortenUrlRequest $request): JsonResponse
    {
        try {
            $url = $this->urlService->shorten($request->validated('url'));
        } catch (RuntimeException) {
            // Handle rare keyspace exhaustion gracefully instead of returning a generic 500.
            return response()->json([
                'message' => 'Could not generate a unique short code. Please try again.',
            ], 503);
        }

        return response()->json([
            'shortCode' => $url->short_code,
            'shortUrl' => url("/{$url->short_code}"),
            'originalUrl' => $url->original_url,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/{shortCode}",
     *     tags={"URLs"},
     *     summary="Redirect to the original URL",
     *     description="Receives a short code and redirects with HTTP 302 to the original URL, incrementing click_count.\n\n⚠️ **Note:** Swagger UI may follow redirects automatically. Use `curl -v http://localhost/{shortCode}` for verification.",
     *     operationId="redirectUrl",
     *
     *     @OA\Parameter(
     *         name="shortCode",
     *         in="path",
     *         required=true,
     *         description="URL short code (1-8 alphanumeric characters)",
     *
     *         @OA\Schema(type="string", example="aBc3mNp", pattern="^[a-zA-Z0-9]{1,8}$")
     *     ),
     *
     *     @OA\Response(
     *         response=302,
     *         description="Successful redirect to the original URL",
     *
     *         @OA\Header(header="Location", description="Original URL", @OA\Schema(type="string", format="uri"))
     *     ),
     *
     *     @OA\Response(response=404, description="Short code not found", @OA\JsonContent(ref="#/components/schemas/NotFoundError"))
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
