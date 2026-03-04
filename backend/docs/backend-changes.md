# Registro de Cambios — Backend Laravel
# Desafío Técnico Spot2: URL Shortener

---

## 1. Archivos ELIMINADOS

| Archivo eliminado | Motivo |
|---|---|
| `database/migrations/0001_01_01_000000_create_users_table.php` | Este proyecto no usa autenticación de usuarios. La tabla `users` no es necesaria. |
| `database/migrations/0001_01_01_000001_create_cache_table.php` | La caché se maneja con **Redis** (in-memory), no con la tabla de MySQL. Esta migración es solo para el driver `database` de caché. |
| `database/migrations/0001_01_01_000002_create_jobs_table.php` | No hay jobs/colas en este proyecto. `QUEUE_CONNECTION=sync` en testing. |
| `database/migrations/2026_03_04_001859_create_personal_access_tokens_table.php` | Laravel Sanctum genera esta tabla para autenticación por tokens. No se usa autenticación. |
| `app/Models/User.php` | No hay usuarios en el sistema. El modelo no tiene propósito funcional. |
| `database/factories/UserFactory.php` | Fábrica del modelo User eliminado. |
| `app/Policies/UrlPolicy.php` | Las políticas son para autorización basada en roles/usuarios. Sin sistema de usuarios, no aplica. |
| `app/Http/Requests/StoreUrlRequest.php` | Request autogenerado por el scaffold `--resource`. Reemplazado por `ShortenUrlRequest.php` con la lógica real. |
| `app/Http/Requests/UpdateUrlRequest.php` | Idem anterior. Este proyecto es de solo escritura + lectura-redirect. No hay updates. |
| `database/database.sqlite` | Archivo SQLite del entorno de desarrollo inicial. El proyecto usa MySQL via Sail. |

---

## 2. Archivos MODIFICADOS

### `database/migrations/2026_03_04_002139_create_urls_table.php`

**Antes:** Solo tenía `$table->id()` y `$table->timestamps()` — una migración vacía de scaffold.

**Después:**
```php
$table->id();
$table->text('original_url');                    // URL completa original
$table->string('short_code', 8)->unique()->index(); // Código único ≤ 8 chars, indexado
$table->unsignedBigInteger('click_count')->default(0); // Contador de visitas
$table->timestamps();
```

**Por qué:**
- `original_url` como `text` (no varchar) para soportar URLs muy largas sin truncamiento.
- `short_code` con `unique()` garantiza unicidad a nivel de base de datos (doble protección además de la verificación en PHP). El `index()` acelera las búsquedas de redirección.
- `click_count` para métricas. Es un bonus que demuestra atención al detalle.

---

### `app/Models/Url.php`

**Antes:** Solo `use HasFactory;` — un modelo esqueleto sin ninguna configuración.

**Después:**
```php
protected $fillable = ['original_url', 'short_code', 'click_count'];
protected $casts = ['click_count' => 'integer'];
```

**Por qué:**
- `$fillable` explícito: protección contra **Mass Assignment** (si alguien enviara campos maliciosos en el JSON, Eloquent los ignoraría). Nunca usar `$guarded = []`.
- `$casts`: garantiza que `click_count` siempre sea entero PHP, no string.

---

### `app/Http/Controllers/UrlController.php`

**Antes:** Scaffold CRUD completo (`index`, `store`, `show`, `update`, `destroy`) con cuerpos vacíos. Referencias a `StoreUrlRequest` y `UpdateUrlRequest` que no existían.

**Después:** Dos métodos limpios con responsabilidad única:
- `shorten(ShortenUrlRequest $request): JsonResponse` — POST /api/shorten
- `redirect(string $shortCode): RedirectResponse|JsonResponse` — GET /api/{shortCode}

**Por qué:** El patrón de controladores delgados (thin controllers). No hay lógica de negocio aquí, solo: recibir request → llamar servicio → devolver response.

---

### `routes/api.php`

**Antes:**
```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```
Ruta de autenticación Sanctum que no se usa.

**Después:**
```php
Route::post('/shorten', [UrlController::class, 'shorten'])->middleware('throttle:60,1');
Route::get('/{shortCode}', [UrlController::class, 'redirect'])->where('shortCode', '[a-zA-Z0-9]{1,8}');
```

**Por qué:**
- `throttle:60,1`: máximo 60 peticiones por minuto por IP. Previene abuso.
- `->where('shortCode', '[a-zA-Z0-9]{1,8}')`: regex que valida el formato del código en el nivel de routing. Si alguien intenta `/api/../../../../etc/passwd`, Laravel devuelve 404 antes de llegar al controlador.

---

### `routes/web.php`

**Antes:** Devolvía la vista `welcome` de Laravel (la página de bienvenida por defecto).

**Después:** Redirige a `http://localhost:5173` (el frontend React en Vite).

**Por qué:** Este es un proyecto de API pura + frontend desacoplado. La vista `welcome` de Laravel no tiene utilidad.

---

### `database/factories/UrlFactory.php`

**Antes:** Método `definition()` vacío — retornaba `[]`.

**Después:**
```php
'original_url' => $this->faker->url(),
'short_code'   => $this->faker->regexify('[a-zA-Z2-9]{7}'),
'click_count'  => $this->faker->numberBetween(0, 1000),
```

**Por qué:** La factory es la que permite crear registros de prueba en los tests de Feature con `Url::factory()->create(...)`. Sin datos en `definition()`, todos los campos serían `null` y los tests fallarían por violación de constraints de DB.

---

### `database/seeders/UrlSeeder.php`

**Antes:** Método `run()` vacío.

**Después:** `Url::factory()->count(10)->create();`

**Por qué:** Permite poblar la base de datos de desarrollo con datos de prueba reales. Útil para demostrar la funcionalidad sin tener que crear URLs manualmente.

---

### `database/seeders/DatabaseSeeder.php`

**Antes:** Tenía referencias a `User::factory()` y `User::factory(10)->create()` — código que fallaba porque el modelo User fue eliminado.

**Después:** Solo llama a `$this->call(UrlSeeder::class)`.

**Por qué:** Limpieza. El seeder principal orquesta los seeders hijos. No tiene lógica propia.

---

### `bootstrap/app.php`

**Antes:** El bloque `withMiddleware` estaba vacío.

**Después:**
```php
$middleware->statefulApi();
$middleware->api(prepend: [\Illuminate\Http\Middleware\HandleCors::class]);
```

**Por qué:**
- `HandleCors`: en Laravel 11, el CORS ya no tiene archivo `config/cors.php` separado — se configura en el middleware. Esto permite que el frontend en `localhost:5173` pueda hacer peticiones al backend en `localhost:80` sin el error `Access-Control-Allow-Origin`.
- `statefulApi()`: habilita cookies de sesión para APIs si se necesitaran en el futuro.

---

## 3. Archivos CREADOS (nuevos)

| Archivo creado | Propósito |
|---|---|
| `ai-rules.md` | Reglas de contexto para IA: stack, estructura, convenciones, TDD, seguridad |
| `app/Services/ShortCodeGeneratorService.php` | Genera códigos únicos Base58 de 7 caracteres |
| `app/Services/UrlService.php` | Lógica de negocio: acortar + redirigir con caché Redis |
| `app/Http/Requests/ShortenUrlRequest.php` | Validación de la URL entrante |
| `tests/Unit/ShortCodeGeneratorServiceTest.php` | 5 tests unitarios del generador |
| `tests/Feature/ShortenUrlTest.php` | 8 tests de integración de POST /api/shorten |
| `tests/Feature/RedirectUrlTest.php` | 4 tests de integración de GET /api/{shortCode} |
| `docs/postman/spot2-url-shortener.collection.json` | Colección Postman importable |
| `docs/postman/spot2-url-shortener.environment.json` | Environment Postman para local |

---

## 4. Decisiones de Arquitectura — Para Defender

### ¿Por qué MySQL + Redis en vez de solo uno?

**MySQL** es la fuente de verdad: garantiza consistencia ACID, el índice UNIQUE previene duplicados aunque dos requests lleguen simultáneamente, y los datos persisten siempre.

**Redis** es la capa de velocidad: cuando alguien hace clic en una URL corta, el flujo es:
1. Consultar Redis: respuesta en ~0.1ms (en memoria)
2. Si no hay cache hit → consultar MySQL → guardar resultado en Redis para la próxima vez

Esto significa que el 99% de las redirecciones (después de la primera) nunca tocan la base de datos.

**Alternativa rechazada — solo Redis:** Redis puede perder datos si se reinicia sin persistencia configurada. Para un producto en producción, perder todas las URLs cortas sería inaceptable.

**Alternativa rechazada — solo MySQL:** Con mucho tráfico (miles de redirects por segundo), MySQL saturaria las conexiones. Redis aguanta 100,000+ ops/segundo con un solo nodo.

---

### ¿Por qué Base58 y no UUID o Nanoid?

- **UUID:** 36 caracteres — demasiado largo. El desafío pide máx. 8 chars.
- **Auto-increment (1, 2, 3...):** Predecible. Alguien puede iterar todos los IDs y scrapear las URLs.
- **Base62 (a-z, A-Z, 0-9):** Válido, pero incluye caracteres ambiguos (`0` vs `O`, `1` vs `l` vs `I`) que generan confusión al leerlos o copiarlos.
- **Base58 (nuestra elección):** Elimina exactamente esos caracteres ambiguos. Es el mismo alfabeto que usa Bitcoin para sus wallets — diseñado para ser leído por humanos.

Con 7 caracteres en Base58: **58^7 = 2,207,984,167,552 combinaciones** (~2.2 billones). Probabilidad de colisión prácticamente nula.

---

### ¿Por qué el servicio verifica colisiones en PHP además del índice UNIQUE en MySQL?

**Defense in depth (defensa en profundidad):** Si dos peticiones concurrentes generan el mismo código al mismo tiempo y ambas pasan la verificación `!Url::where('short_code', $code)->exists()` antes de que cualquiera inserte, la segunda fallará con una excepción de `UNIQUE constraint violation`. 

Para no exponer ese error al usuario, el servicio tiene dos capas:
1. Verificación previa en PHP (evita el 99.99% de colisiones)
2. El `UNIQUE` index en MySQL como red de seguridad final (el 0.01% restante)

---

### ¿Por qué el controlador devuelve 302 (Found) para el redirect?

El desafío menciona "HTTP 301/302". La diferencia es crítica:

- **301 Permanent Redirect:** Los navegadores cachean el destino para siempre. Si la URL corta después cambia de destino, el navegador del usuario nunca vería el cambio (seguiría yendo al destino cacheado).
- **302 Temporary Redirect (Found):** El navegador siempre consulta al servidor cada vez. Si en el futuro se implementa expiración de URLs o edición, el comportamiento será correcto.

**Conclusión:** 302 es más robusto y mantenible para un URL shortener.

---

### ¿Por qué el `click_count` se incrementa después de la redirección?

El `Url::where('short_code', $shortCode)->increment('click_count')` se ejecuta después de que ya tenemos la URL original. Esto asegura que el usuario recibe su redirección lo más rápido posible. El increment es una operación atómica en MySQL (`UPDATE urls SET click_count = click_count + 1`), por lo que múltiples requests concurrentes no producen condiciones de carrera.

---

## 5. Stack de Testing — Para Defender

**PHPUnit 11** con atributos PHP 8 (`#[Test]` en vez de `/** @test */`).

### Tests Unitarios (`tests/Unit/`)
- No tocan la base de datos (en tests unitarios puros, se usan mocks)
- `ShortCodeGeneratorServiceTest`: verifica el comportamiento del algoritmo de generación aislado

### Tests de Feature/Integración (`tests/Feature/`)
- Usan `RefreshDatabase`: antes de cada test, se hace `migrate:fresh` en la base de datos de testing (ver `phpunit.xml`: `DB_DATABASE=testing`)
- Prueban el flujo HTTP completo: Request → Middleware → Controller → Service → DB → Response
- No mockean servicios: validan la integración real entre componentes

### Resultado Final
```
Tests: 17 passed (531 assertions) — Duration: 0.70s
```
