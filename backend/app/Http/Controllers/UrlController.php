<?php

declare(strict_types=1);

namespace App\Http\Controllers;

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
     * @OA\Post(
     *     path="/api/shorten",
     *     tags={"URLs"},
     *     summary="Acortar una URL",
     *     description="Recibe una URL larga y devuelve un código corto único de máximo 8 caracteres (Base58).",
     *     operationId="shortenUrl",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"url"},
     *             @OA\Property(
     *                 property="url",
     *                 type="string",
     *                 format="uri",
     *                 example="https://www.google.com/maps/search/restaurantes+en+cdmx",
     *                 description="URL válida con protocolo (http:// o https://), máximo 2048 caracteres"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="URL acortada exitosamente",
     *         @OA\JsonContent(ref="#/components/schemas/ShortenedUrl")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="URL inválida o faltante",
     *         @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *     ),
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
            'short_code' => $url->short_code,
            'short_url' => url("/{$url->short_code}"),
            'original_url' => $url->original_url,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/{shortCode}",
     *     tags={"URLs"},
     *     summary="Redirigir a la URL original",
     *     description="Recibe un short code y redirige al usuario a la URL original con HTTP 302. Incrementa el contador de visitas.\n\n⚠️ **Nota:** Este endpoint no se puede probar con 'Try it out' en Swagger UI porque el browser sigue el redirect a un sitio externo que no tiene CORS habilitado para localhost. Probarlo directamente en la barra del browser o con curl: `curl -v http://localhost/{shortCode}`",
     *     operationId="redirectUrl",
     *     @OA\Parameter(
     *         name="shortCode",
     *         in="path",
     *         required=true,
     *         description="Código corto de la URL (1-8 caracteres alfanuméricos)",
     *         @OA\Schema(type="string", example="aBc3mNp", pattern="^[a-zA-Z0-9]{1,8}$")
     *     ),
     *     @OA\Response(
     *         response=302,
     *         description="Redirección exitosa a la URL original",
     *         @OA\Header(
     *             header="Location",
     *             description="URL original a la que se redirige",
     *             @OA\Schema(type="string", format="uri")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Short code no encontrado",
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
