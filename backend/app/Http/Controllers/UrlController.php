<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\GetUrlsQueryRequest;
use App\Http\Requests\ShortenUrlRequest;
use App\Services\UrlService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class UrlController extends Controller
{
    public function __construct(
        private readonly UrlService $urlService,
    ) {
    }

    /**
     * @OA\Get(
     *     path="/api/urls",
     *     tags={"URLs"},
     *     summary="Listar URLs",
     *     description="Devuelve una lista paginada de URLs acortadas. Permite filtrar por texto.",
     *     operationId="getUrls",
     *
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número de página",
     *         required=false,
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Cantidad de resultados por página",
     *         required=false,
     *         @OA\Schema(type="integer", default=15)
     *     ),
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Texto para buscar en la URL original o en el código corto",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Lista de URLs",
     *     )
     * )
     */
    public function index(GetUrlsQueryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 15);
        $search = $validated['search'] ?? null;

        $paginator = $this->urlService->getPaginated($perPage, $search);

        return \App\Http\Resources\UrlResource::collection($paginator)->response();
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
     *         @OA\Schema(type="string", example="aBc3mNp")
     *     ),
     *
     *     @OA\Response(
     *         response=204,
     *         description="URL eliminada exitosamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Short code no encontrado",
     *         @OA\JsonContent(ref="#/components/schemas/NotFoundError")
     *     )
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
     *     description="Recibe una URL larga y devuelve un código corto único de máximo 8 caracteres (Base58).",
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
     *                 description="URL válida con protocolo (http:// o https://), máximo 2048 caracteres"
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="URL acortada exitosamente",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="shortCode", type="string", example="aBc3mNp"),
     *             @OA\Property(property="shortUrl", type="string", format="uri", example="http://localhost/aBc3mNp"),
     *             @OA\Property(property="originalUrl", type="string", format="uri", example="https://www.google.com/maps/search/restaurantes+en+cdmx")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="URL inválida o faltante",
     *         @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *     ),
     *
     *     @OA\Response(
     *         response=429,
     *         description="Rate limit excedido (60 req/min por IP)"
     *     )
     * )
     */
    public function shorten(ShortenUrlRequest $request): JsonResponse
    {
        $url = $this->urlService->shorten($request->validated('url'));

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
     *     summary="Redirigir a la URL original",
     *     description="Recibe un short code y redirige al usuario a la URL original con HTTP 302. Incrementa el contador de visitas.\n\n⚠️ **Nota:** Este endpoint no se puede probar con 'Try it out' en Swagger UI porque el browser sigue el redirect a un sitio externo que no tiene CORS habilitado para localhost. Probarlo directamente en la barra del browser o con curl: `curl -v http://localhost/{shortCode}`",
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
     *         @OA\Header(
     *             header="Location",
     *             description="URL original a la que se redirige",
     *
     *             @OA\Schema(type="string", format="uri")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Short code no encontrado",
     *
     *         @OA\JsonContent(ref="#/components/schemas/NotFoundError")
     *     )
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
