# Q&A Técnico — Spot2 URL Shortener
# Guía de defensa para entrevista

---

## 1. Arquitectura General

**P: ¿Por qué elegiste Laravel y no Node.js/Express o FastAPI?**

R: El stack principal de Spot2 es PHP/Laravel según el challenge. Laravel tiene un ecosistema maduro para este tipo de proyectos: Eloquent ORM previene SQL injection automáticamente, el sistema de migraciones garantiza consistencia del schema, y el container de inyección de dependencias facilita el TDD. Además, Laravel Sail hace que el entorno local sea idéntico al de producción con un solo comando.

---

**P: ¿Por qué la ruta de redirección está en `web.php` y no en `api.php`?**

R: Porque el objetivo de un URL shortener es generar URLs cortas y limpias. Si el redirect estuviera en `api.php`, la URL sería `http://dominio.com/api/aBc3mNp` — el `/api/` prefix hace la URL más larga innecesariamente. Al ponerlo en `web.php`, la URL es simplemente `http://dominio.com/aBc3mNp`, que es exactamente lo que se espera de un URL shortener real.

---

## 2. Base de Datos

**P: ¿Por qué MySQL y no una base de datos NoSQL como MongoDB o DynamoDB?**

R: Para un URL shortener, la necesidad más crítica es **consistencia**: si dos usuarios acortan URLs simultáneamente, ambos deben obtener códigos únicos garantizados. MySQL ofrece ACID y un constraint `UNIQUE` que actúa como red de seguridad final. Un error de duplicado en MongoDB requeriría lógica adicional en la aplicación.

Además, el patrón de acceso es simple: búsquedas por `short_code` (clave primaria, O(1) con índice). No hay consultas complejas que requieran la flexibilidad de NoSQL.

Para la velocidad de lectura (el 99% del tráfico son redirects), usamos Redis como capa de caché encima de MySQL.

---

**P: ¿Qué pasa si Redis se cae?**

R: El sistema sigue funcionando porque `Cache::remember()` en Laravel hace fallback automático al closure (MySQL) cuando el cache no responde. Las redirecciones serán ~50x más lentas (5ms vs 0.1ms) pero nunca fallarán. Redis es una capa de optimización, no un punto de fallo único.

---

**P: ¿Por qué no guardar en Redis directamente sin MySQL?**

R: Redis por defecto es in-memory. Si el servidor se reinicia sin AOF (Append-Only File) persistence configurado, todos los datos se pierden. Para un URL shortener en producción, perder las URLs sería inaceptable. MySQL persiste todo a disco con garantías ACID.

---

**P: ¿Qué esquema tiene la tabla `urls`?**

R:
```sql
id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
original_url TEXT            NOT NULL
short_code   VARCHAR(8)      NOT NULL UNIQUE
click_count  BIGINT UNSIGNED NOT NULL DEFAULT 0
created_at   TIMESTAMP       NULL
updated_at   TIMESTAMP       NULL
```

El `UNIQUE` index en `short_code` garantiza unicidad a nivel de base de datos. El `INDEX` acelera los lookups de redirección. `TEXT` para `original_url` soporta URLs hasta 65KB sin truncamiento.

---

## 3. Algoritmo de Generación de Códigos

**P: ¿Cómo generas los short codes?**

R: Usamos Base58 (similar al que usa Bitcoin). El alfabeto tiene 58 caracteres: todas las letras y números excepto `0`, `O`, `1`, `l`, `I` que son visualmente ambiguos. Con 7 caracteres, tenemos 58^7 = 2.2 billones de combinaciones únicas, generadas con `random_int()` que es criptográficamente seguro en PHP.

---

**P: ¿Cómo evitas colisiones?**

R: En dos capas:
1. Antes de insertar, verificamos que el código no exista en DB (`!Url::where('short_code', $code)->exists()`). Si existe, regeneramos hasta 5 veces.
2. El índice `UNIQUE` en MySQL actúa como garantía final ante race conditions.

Con 2.2 billones de combinaciones, la probabilidad de colisión con, digamos, 10 millones de URLs almacenadas es de 0.0000045% por intento.

---

**P: ¿Por qué 7 caracteres y no 6 u 8?**

R: Con 6 caracteres Base58 tenemos 38 millones de combinaciones — suficiente para muchos casos pero puede ser limitante a escala. Con 7 llegamos a 2.2 billones. El límite del challenge es 8 caracteres; usamos 7 para dar margen y asegurar que la short URL siempre sea significativamente más corta que la original. Con 8 chars podría rozar el límite del challenge.

---

**P: ¿Por qué no usar UUID o ULID?**

R: UUID tiene 36 caracteres. El challenge pide máximo 8. ULID tampoco cabe en 8 chars. Además, ambos son predecibles en cierta medida (UUID v1 incluye timestamp, ULID tiene orden cronológico).

---

## 4. Performance y Escalabilidad

**P: ¿Cómo escalarías esto a millones de requests diarios?**

R:
1. **Caché Redis ya implementado**: la mayoría de redirects son cache hits, nunca tocan MySQL.
2. **Read replicas de MySQL**: los redirects solo leen, pueden ir a réplicas. Los writes (shorten) van al master.
3. **CDN con edge caching**: para URLs muy populares, incluso Redis puede ser el bottleneck. Un CDN puede cachear la respuesta 302 en el edge más cercano al usuario.
4. **Sharding de Redis**: si el volumen supera un nodo, Redis Cluster distribuye las keys automáticamente.
5. **Horizontal scaling de la app**: como Laravel es stateless (sin sesiones de API), múltiples réplicas del contenedor detrás de un load balancer es trivial.

---

**P: ¿Qué es el cache-aside pattern que usas?**

R: Es el patrón donde la aplicación, no la base de datos, gestiona el caché. El flujo es:
1. Buscar en Redis → si existe, retornar (cache hit)
2. Si no existe (cache miss) → buscar en MySQL → guardar resultado en Redis → retornar

`Cache::remember()` de Laravel implementa este patrón en una sola línea. Es preferible a pushear proactivamente al caché porque solo cachea lo que se usa (lazy loading).

---

**P: ¿Cuál es la complejidad temporal de cada operación?**

R:
- `POST /api/shorten`: O(1) — generación de código + insert en MySQL (O(log n) para el índice B-tree, pero n es el número de registros).
- `GET /{shortCode}`: O(1) — búsqueda por key en Redis o por índice en MySQL.

---

## 5. Seguridad

**P: ¿Cómo previenen SQL Injection?**

R: Usando Eloquent ORM que internamente usa PDO con prepared statements. Nunca construimos queries con concatenación de strings. Por ejemplo: `Url::where('short_code', $shortCode)` genera internamente `SELECT * FROM urls WHERE short_code = ?` con binding parametrizado.

---

**P: ¿Cómo protegen contra XSS?**

R: Laravel escapa automáticamente todos los valores en respuestas JSON con `json_encode()`. No generamos HTML en este backend, pero si se lo devuelve al frontend, React también escapa por defecto al renderizar. Para las URLs que redirigimos, usamos `redirect()->away()` que es un header HTTP, no contenido HTML renderizado.

---

**P: ¿Cómo previenen CSRF?**

R: La API es stateless — no usa cookies de sesión para autenticación. CSRF es un ataque que explota que los navegadores envían cookies automáticamente. Sin cookies, no hay superficie de ataque CSRF. El endpoint `POST /api/shorten` acepta JSON, no form submissions, lo que también mitiga este vector.

---

**P: ¿Qué es el rate limiting implementado?**

R: `throttle:60,1` es el middleware de Laravel que limita a 60 requests por minuto por IP en el endpoint `POST /api/shorten`. Si se excede, Laravel devuelve automáticamente `429 Too Many Requests` con el header `Retry-After`. Esto previene abuso automatizado del servicio.

---

## 6. Testing y TDD

**P: ¿Cuál es tu proceso TDD?**

R: Red → Green → Refactor:
1. **Red**: escribir el test que describe el comportamiento esperado. El test falla porque el código no existe.
2. **Green**: escribir el código mínimo para que el test pase.
3. **Refactor**: mejorar el código sin romper los tests.

En este proyecto, los tests de `ShortenUrlTest` y `RedirectUrlTest` se escribieron primero, definiendo el contrato de la API. Luego se implementaron los servicios y el controlador.

---

**P: ¿Cuál es la diferencia entre tus tests Unit y Feature?**

R:
- **Unit** (`tests/Unit/`): testean una clase en aislamiento. `ShortCodeGeneratorServiceTest` verifica el algoritmo de generación sin depender de bases de datos. No hacen requests HTTP.
- **Feature** (`tests/Feature/`): testean el flujo HTTP completo. Hacen requests reales contra la aplicación, validan que el controlador, el servicio y la base de datos interactúan correctamente. Usan `RefreshDatabase` para limpiar la DB entre tests.

---

**P: ¿Por qué los tests usan `RefreshDatabase` y no fixtures?**

R: `RefreshDatabase` ejecuta `migrate:fresh` antes de cada test, garantizando un estado limpio y predecible. Los fixtures (datos pre-insertados) pueden crear dependencias entre tests y hacer que fallen al cambiar el orden de ejecución. Con `RefreshDatabase` + el uso de `factory()` para crear datos, cada test es completamente independiente.

---

**P: ¿Por qué usar `#[Test]` en vez de `/** @test */`?**

R: A partir de PHPUnit 11, los doc-comment annotations están deprecados y serán removidos en PHPUnit 12. Los atributos PHP 8 (`#[Test]`) son la forma moderna y nativa del lenguaje para metadata de métodos. También son más performantes ya que son parseados en tiempo de compilación, no en runtime.

---

## 7. Docker y Deployment

**P: ¿Qué es Laravel Sail?**

R: Sail es una capa sobre Docker Compose provista por Laravel. El `compose.yaml` define tres servicios: `laravel.test` (PHP 8.5 con Nginx), `mysql:8.4` e `redis:alpine`. Sail provee un script bash que envuelve los comandos de Docker, haciendo que `./vendor/bin/sail artisan test` corra PHPUnit dentro del contenedor como si estuviera instalado localmente.

---

**P: ¿Cómo lo desplegarías a producción?**

R: Idealmente con un pipeline CI/CD (GitHub Actions en el repo). Los pasos serían:
1. Push a `main` → trigger del pipeline
2. Correr tests: `php artisan test`
3. Build de la imagen Docker con el `Dockerfile` de Sail
4. Push a un registry (ECR, Docker Hub, etc.)
5. Deploy en un servicio de contenedores (AWS ECS, GCP Cloud Run, DigitalOcean Apps)

Variables de entorno sensibles (DB_PASSWORD, APP_KEY) se inyectan via secrets del CI/CD, nunca en el repositorio.

Para producción, cambiar `APP_DEBUG=false`, `APP_ENV=production`, y configurar Redis con AOF persistence.

---

**P: ¿Cómo configurarías Redis en producción para no perder datos?**

R: Activar AOF (Append-Only File) en Redis: `appendonly yes` en `redis.conf`. Esto escribe cada operación a disco antes de confirmarla. También se puede usar `SAVE` para snapshots periódicos. En AWS, ElastiCache con configuración de backup automático. Para este sistema, Redis de todas formas es caché — si se pierde, el siguiente request simplemente va a MySQL y regenera el caché.

---

## 8. Decisiones de Diseño Específicas

**P: ¿Por qué el `click_count` se guarda en MySQL y no en Redis?**

R: Para persistencia garantizada. Si guardáramos contadores solo en Redis y éste falla, perderíamos las métricas. MySQL con `UPDATE ... SET click_count = click_count + 1` es atómico a nivel de fila — múltiples requests concurrentes no producen race conditions. Si el volumen de escrituras fuera extremo, podríamos usar Redis como buffer y flush periódico a MySQL.

---

**P: ¿Qué pasa si la misma URL se acorta dos veces?**

R: El sistema genera dos códigos distintos. Esto es una decisión de diseño consciente: la URL se almacena dos veces en la base de datos, cada una con su código único. La alternativa sería un índice UNIQUE en `original_url` y usar `firstOrCreate`, pero eso tiene implicaciones: (1) las URLs pueden ser muy largas y hacer el índice costoso, (2) en algunos casos de uso se quiere generar múltiples códigos para la misma URL para rastrear diferentes campañas. Elegimos la opción más flexible.

---

**P: ¿Por qué HTTP 302 y no 301?**

R: HTTP 301 es "Moved Permanently" — los navegadores cachean el destino *para siempre*. Si el dueño de la URL corta quiere cambiar el destino (feature futuro), el usuario con la respuesta cacheada nunca vería el cambio. HTTP 302 es "Found" (temporal) — el navegador siempre consulta al servidor, lo que nos da control total sobre el comportamiento. Para un product en producción, la controlabilidad vale más que el marginal ahorro de un request.

---

**P: ¿Por qué `text` para `original_url` en vez de `varchar(2048)`?**

R: MySQL tiene un límite de 767 bytes para índices en columnas `varchar`. Si quisiéramos hacer la URL unique más adelante, `varchar(2048)` no podría indexarse directamente. `text` no tiene este problema. Además, `varchar` en MySQL ocupa el espacio real de la cadena más 2 bytes — no hay penalización real por usar `text` para strings largos. La validación del máximo de 2048 chars la hacemos en el Form Request de PHP, no en la DB.
