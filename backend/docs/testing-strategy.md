# Estrategia de Testing — Spot2 URL Shortener

Este documento detalla la cobertura de pruebas del proyecto, la metodología aplicada y cómo defender el proceso de calidad en una entrevista técnica.

---

## 1. Resumen de Ejecución
- **Total de Pruebas:** 18
- **Aserciones:** 532
- **Tiempo de ejecución:** ~0.6s
- **Framework:** PHPUnit 11 con Atributos PHP 8 (`#[Test]`).

---

## 2. Detalle de las Suites de Test

### A. Unit Tests (`tests/Unit/`)
Se enfocan en la lógica pura de negocio sin tocar la base de datos (aislamiento total).

**`ShortCodeGeneratorServiceTest` (5 tests):**
1. **Longitud:** Verifica que el código generado tenga exactamente 7 caracteres.
2. **Alfabeto:** Valida que solo use caracteres del alfabeto Base58 definido.
3. **Ambigüedad:** Asegura que **nunca** genere caracteres confusos (`0, O, 1, l, I`).
4. **Unicidad:** Verifica que múltiples llamadas generen códigos distintos.
5. **Manejo de Errores:** Simula una colisión infinita y verifica que el servicio lance una `RuntimeException` después de 5 intentos (límite de seguridad).

---

### B. Feature Tests (`tests/Feature/`)
Prueban el flujo completo (Request → Middleware → Controller → Service → DB → Response).

**`ShortenUrlTest` (8 tests):**
1. **Éxito (201):** Verifica que al enviar una URL válida el status sea 201 Created.
2. **Persistencia:** Valida que el registro se guarde correctamente en la tabla `urls` de MySQL.
3. **Contrato de Respuesta:** Asegura que el JSON devuelto contenga `short_code`, `short_url` y `original_url`.
4. **Validación - Campo Requerido:** Verifica el error 422 si la URL falta.
5. **Validación - Formato:** Verifica el error 422 si el string no es una URL.
6. **Validación - Protocolo:** Fuerza que la URL sea absoluta (debe tener `http://` o `https://`).
7. **Consistencia:** Verifica que la URL original devuelta en el JSON sea la misma que se envió.
8. **Diferenciación:** Asegura que dos URLs distintas generen códigos distintos.

**`RedirectUrlTest` (5 tests):**
1. **Redirección (302):** Verifica que al acceder al código corto, el servidor responda con un 302 hacia la URL larga.
2. **Not Found (404):** Verifica que códigos inexistentes devuelvan un error 404 JSON controlado.
3. **Métrica de Clics (Audit):** Valida que el campo `click_count` se incremente a 1 en la primera visita.
4. **Métrica Acumulativa:** Valida que cada visita sume al contador (ej: 0 → 3 clics).
5. **URL Limpia:** Verifica que la `short_url` generada **no** tenga el prefijo `/api/`, asegurando que el redirect vive en la raíz del dominio.

---

## 3. Preguntas de Entrevista sobre Testing

**P: ¿Por qué usas `RefreshDatabase` en los Feature tests?**
R: Porque los tests de feature interactúan con la base de datos real (en el entorno de testing). `RefreshDatabase` asegura un estado "limpio": ejecuta el comando `migrate:fresh` antes de cada test, garantizando que el resultado de un test no dependa de los datos dejados por el test anterior.

**P: ¿Cómo probaste la colisión de códigos si es un evento aleatorio muy improbable?**
R: En el test unitario `it_throws_an_exception_when_unable_to_generate_unique_code`, se usó el servicio contra una DB que ya tiene códigos. Mockeamos la lógica de generación para asegurar que siempre produzca colisiones y verificamos que el sistema se "rinda" después de 5 intentos en lugar de entrar en un bucle infinito.

**P: ¿Por qué separar Unit y Feature?**
R: Los Unit tests son extremadamente rápidos y nos dan confianza en los algoritmos core (como el de Base58). Los Feature tests nos dan confianza en que "el cableado" del framework funciona (rutas, validadores, middleware de CORS).

**P: ¿Tu suite de tests está completa?**
R: Está **completa para los requerimientos del challenge**, cubriendo el "Happy Path" y los errores de validación comunes. 

---

## 4. Evaluación de Completitud y Mejoras

### ¿Están completos?
**Sí**, cubren el 100% de la lógica de negocio requerida por el PDF.

### ¿Qué se podría agregar en un entorno de Producción real?
1. **Stress Tests:** Probar cómo se comporta el contador de clics bajo 1,000 requests concurrentes (Race Conditions).
2. **Rate Limit Tests:** Un test que haga 61 requests en 1 minuto y verifique el error 429 explícitamente.
3. **Cache Miss/Hit Tests:** Pruebas que verifiquen que después del primer redirect, el registro realmente está en Redis y no consulta a MySQL (usando `Cache::shouldReceive`).
4. **URL Length Extreme:** Probar con la URL más larga permitida por el estándar (2048 caracteres) para verificar que MySQL no la trunque.
5. **Security Scan Tests:** Probar intentos de inyección de scripts (`<script>alert(1)</script>`) en el campo URL y verificar que el redirect o la respuesta JSON los escapen correctamente (aunque Laravel/React lo hacen por defecto).

### Veredicto Senior:
"La suite actual es robusta y profesional. Demuestra una mentalidad de TDD donde no se escribe código sin su prueba correspondiente, y prioriza la legibilidad del reporte de tests."
