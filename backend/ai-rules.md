# AI Rules — Backend (Laravel)

## Contexto del Proyecto
Acortador de URLs (Spot2 Tech Challenge). API REST construida con **Laravel 12** corriendo sobre **Laravel Sail** (Docker). Base de datos **MySQL 8.4** + caché **Redis**. Sin autenticación de usuario: la API es pública.

## Stack
- **PHP 8.2+** / Laravel 12
- **MySQL 8.4** — fuente de verdad (tabla `urls`)
- **Redis** — caché de redirecciones (TTL 24h por defecto)
- **Laravel Sail** — entorno Docker local
- **PHPUnit 11** — testing (TDD estricto)

## Estructura de Directorios

```
app/
  Http/
    Controllers/Api/   ← solo UrlController.php
    Requests/          ← ShortenUrlRequest.php para validación
  Models/              ← solo Url.php (sin User.php)
  Services/            ← ShortCodeGeneratorService.php, UrlService.php
database/
  migrations/          ← solo create_urls_table.php
  factories/           ← UrlFactory.php
  seeders/             ← DatabaseSeeder.php, UrlSeeder.php
routes/
  api.php              ← POST /shorten, GET /{shortCode}
tests/
  Unit/                ← ShortCodeGeneratorServiceTest.php
  Feature/             ← ShortenUrlTest.php, RedirectUrlTest.php
```

## Convenciones de Código

### Generales
- Seguir **PSR-12** estrictamente (usar `./vendor/bin/sail exec laravel.test ./vendor/bin/pint` para formatear)
- **Tipado estricto** en todos los archivos PHP: `declare(strict_types=1);`
- **Type hints** en todos los métodos: parámetros y retornos
- Preferir **excepciones descriptivas** sobre retornos nulos silenciosos
- Comentarios en **inglés** (código), mensajes de error de API en **inglés**

### Naming
- Clases: `PascalCase`
- Métodos y variables: `camelCase`
- Columnas DB y rutas: `snake_case`
- Constantes: `UPPER_SNAKE_CASE`

### Servicios
- Un servicio = una responsabilidad (SRP)
- Los servicios NO dependen de Request/Response (son testeables sin HTTP)
- Inyección de dependencias vía constructor (no `app()->make()` inline)

### Controladores
- Delgados: solo validan Request, llaman al servicio, devuelven Response
- Nunca lógica de negocio en controladores
- Respuestas JSON con códigos HTTP correctos: `201` (creado), `302` (redirect), `404` (no encontrado), `422` (validación)

### Base de Datos
- Siempre usar **Eloquent** o **Query Builder** — nunca SQL raw
- Índice `UNIQUE` en `short_code` para prevenir colisiones a nivel DB
- Usar `firstOrCreate` / `updateOrCreate` cuando aplique

### Caché (Redis)
- Key pattern: `url:redirect:{shortCode}` → valor: URL original
- TTL: 86400 segundos (24 horas) por defecto
- Siempre usar `Cache::remember()` en las redirecciones (no sets manuales)

## TDD — Reglas Estrictas
1. **Escribir el test PRIMERO**, luego la implementación mínima para pasarlo
2. Los tests de Feature usan `RefreshDatabase` + `WithoutMiddleware` cuando sea necesario
3. Los tests de Unit no deben tocar la DB: usar mocks/stubs (Mockery)
4. Nombrar tests en snake_case descriptivo: `it_generates_a_unique_short_code()`
5. Un assert por test (cuando sea posible)
6. Correr `./vendor/bin/sail artisan test` antes de cada commit

## Seguridad
- Validar toda URL entrante con `url` rule de Laravel (previene inyección)
- Rate limiting en `POST /shorten`: 60 req/min por IP
- No usar auto-increment como short code (predecible)
- Escapar outputs en respuestas JSON (Laravel lo hace por defecto)
- No exponer stack traces en producción (`APP_DEBUG=false`)

## Qué NO hacer
- ❌ No agregar autenticación (no es requerida por el desafío)
- ❌ No instalar paquetes no necesarios (mantener `composer.json` limpio)
- ❌ No lógica de negocio en migraciones ni seeders
- ❌ No usar `dd()` / `dump()` en código que vaya a producción
- ❌ No usar `*` en `$fillable` (listar campos explícitamente)
- ❌ No crear migraciones de `users`, `sessions`, `jobs`, `cache` — este proyecto no las usa

## Comandos Frecuentes (todos dentro de Sail)

```bash
# Correr el entorno
cd backend && ./vendor/bin/sail up -d

# Crear archivos
./vendor/bin/sail artisan make:model NombreModelo -mf
./vendor/bin/sail artisan make:controller Api/NombreController --api
./vendor/bin/sail artisan make:request NombreRequest

# Migraciones
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan migrate:fresh --seed

# Tests
./vendor/bin/sail artisan test
./vendor/bin/sail artisan test --filter=NombreTest
./vendor/bin/sail artisan test --coverage

# Formatear código
./vendor/bin/sail exec laravel.test ./vendor/bin/pint
```
