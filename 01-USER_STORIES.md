# Nexus — Historias de Usuario (MVP)

Este documento consolida las Historias de Usuario (User Stories) clave para el Producto Mínimo Viable (MVP) de Nexus.

**Arquetipo de Usuario:** "El Jugador Estratégico"

*   **Perfil:** Jugador de videojuegos de 25-40 años, con un trabajo de tiempo completo. Es un entusiasta que valora su tiempo y su dinero.
*   **Comportamiento:** Tiene un "backlog" que le genera ansiedad, se siente abrumado por las ofertas y quiere tomar decisiones informadas sobre a qué jugar y cuándo comprar.
*   **Objetivo con Nexus:** Necesita una herramienta única y sin fricciones para organizar su caos digital, disfrutar más de lo que ya tiene y comprar de manera inteligente.

---

## Épica: 👤 Autenticación y Seguridad

### US-AUTH-01: Implementar flujo de login en el frontend

*   **Como** jugador,
*   **quiero** registrarme e iniciar sesión en la aplicación con mi email y contraseña,
*   **para** que mi biblioteca de juegos y mis alertas estén seguras y sean privadas.

**Escenarios:**
*   Un nuevo usuario llega a la aplicación y ve una pantalla de login/registro.
*   Un usuario existente abre la app y puede ingresar sus credenciales.
*   Un usuario olvida su contraseña (funcionalidad futura, pero a tener en cuenta).

**Criterios de Aceptación:**
*   [ ] Existe una página de Login (`/login`) y una de Registro (`/register`).
*   [ ] El frontend envía las credenciales al endpoint `POST /api/auth/login`.
*   [ ] Si el login es exitoso, el `access_token` y `refresh_token` se guardan de forma segura en el cliente (ej. `localStorage` o `sessionStorage`).
*   [ ] El cliente Axios es interceptado para adjuntar el `Authorization: Bearer <token>` en todas las peticiones subsecuentes.
*   [ ] Si una petición falla con un 401, el sistema intenta usar el `refresh_token` para obtener un nuevo `access_token`. Si esto también falla, se redirige al usuario a `/login`.
*   [ ] La variable de entorno `DEV_NO_AUTH=1` ya no es necesaria para el funcionamiento normal del frontend.

**Casos Edge:**
*   El usuario introduce un email con formato incorrecto.
*   El usuario introduce una contraseña incorrecta.
*   La API de backend no está disponible durante el intento de login.

---

## Épica: 📚 Manager (Gestión de Biblioteca)

### US-MAN-01: Agregar un juego a mi biblioteca

*   **Como** jugador,
*   **quiero** buscar cualquier juego y agregarlo a mi biblioteca personal, especificando en qué plataforma lo tengo,
*   **para** poder centralizar mi colección y mi backlog en un solo lugar.

**Escenarios:**
*   Un jugador busca "Cyberpunk 2077", lo encuentra y lo agrega como "PC".
*   Un jugador busca un juego indie menos conocido y también lo encuentra gracias a la base de datos de IGDB.

**Criterios de Aceptación:**
*   [ ] La página de búsqueda (`/search`) tiene un campo de texto para buscar juegos.
*   [ ] Al escribir, se llama al endpoint `GET /api/search?q=...`.
*   [ ] Los resultados muestran carátula y título. No muestran HLTB ni precio (regla de negocio).
*   [ ] Al hacer clic en "Agregar" en un resultado, se muestra un selector de plataforma (`PC`, `Switch 2`, `Xbox`, `PS5`).
*   [ ] Al seleccionar una plataforma, se llama a `POST /api/library` con el `igdb_id` y la `platform`.
*   [ ] El juego aparece inmediatamente en la vista del Dashboard (`/`), con el estado por defecto "Pendiente".
*   [ ] El backend enriquece el juego con datos de HLTB y flags (coop, crossplay) de forma automática.

**Casos Edge:**
*   La búsqueda no devuelve resultados.
*   El usuario intenta agregar un juego + plataforma que ya existe en su biblioteca (la API debe devolver un `409 Conflict` y la UI debe mostrar un mensaje amigable como "Este juego ya está en tu biblioteca").
*   La API de IGDB no responde o está lenta.

### US-MAN-02: Organizar mi backlog por filtros y ordenamiento

*   **Como** jugador,
*   **quiero** filtrar y ordenar mi biblioteca por diferentes criterios como duración, si es cooperativo o mi disfrute,
*   **para** poder decidir rápidamente a qué jugar según el tiempo que tengo o con quién voy a jugar.

**Escenarios:**
*   **Noche de Coop:** Un jugador tiene amigos en casa. Filtra por "Cooperativo" y "Crossplay" para ver qué pueden jugar juntos entre su PC y la Xbox de su amigo.
*   **Fin de Semana Corto:** Un jugador tiene solo un fin de semana. Ordena su backlog por "Duración (ascendente)" para encontrar un juego que pueda terminar.
*   **Análisis de Valor:** Un jugador ordena por `$/hora` para ver qué compras han sido más rentables en términos de entretenimiento.

**Criterios de Aceptación:**
*   [ ] La vista de biblioteca (`/`) tiene controles visibles para filtrar y ordenar.
*   [ ] Se puede filtrar por `status` (Pendiente, Jugando, etc.), `platform`, `coop` (booleano) y `crossplay` (booleano).
*   [ ] Se puede ordenar por `duración` (asc/desc), `disfrute` (desc), `$/hora` (asc) y `fecha de adición` (desc).
*   [ ] Al aplicar un filtro/orden, la UI llama al endpoint `GET /api/library` con los parámetros correspondientes (ej. `?coop=true&sort=duration_asc`).
*   [ ] La lógica de ordenamiento y filtrado reside 100% en el backend. El frontend solo renderiza los resultados.

**Casos Edge:**
*   Un juego no tiene datos de HLTB. Debe aparecer al final de la lista cuando se ordena por duración.
*   Un juego no tiene precio de compra registrado. No debe aparecer cuando se ordena por `$/hora`.
*   La combinación de filtros no devuelve ningún resultado. La UI debe mostrar un mensaje claro ("No se encontraron juegos con estos filtros").

---

## Épica: 💰 Hunter (Monitor de Ofertas)

### US-HUNT-01: Vigilar el precio de un juego que deseo

*   **Como** jugador,
*   **quiero** agregar un juego a mi lista de deseados (watches) y establecer un precio objetivo,
*   **para** que el sistema me notifique automáticamente cuándo es el mejor momento para comprarlo.

**Escenarios:**
*   Un jugador quiere "Elden Ring" para Steam, pero le parece caro. Crea un "watch" con un precio objetivo de ARS$ 15.000.
*   Un jugador quiere el próximo Zelda en la eShop, pero no sabe cuánto costará. Crea un "watch" sin precio objetivo, solo para que le avise cuando alcance su mínimo histórico.

**Criterios de Aceptación:**
*   [ ] Desde la tarjeta de un juego (en búsqueda o biblioteca), hay una opción para "Vigilar precio".
*   [ ] Al activarla, se puede seleccionar la tienda (`Steam`, `eShop`, `Xbox`). No se puede seleccionar `PS5`.
*   [ ] Hay un campo opcional para `target_price`.
*   [ ] Al guardar, se llama a `POST /api/watches`.
*   [ ] El juego vigilado aparece en una vista dedicada (`/hunter` o `/wishlist`).
*   [ ] La vista de vigilancia muestra el precio actual, el precio objetivo y el mínimo histórico conocido.

**Casos Edge:**
*   El usuario intenta vigilar un juego en una tienda que no tiene cobertura en ITAD (ej. una tienda indie muy pequeña). El sistema debe informar que no se pueden obtener precios.
*   El usuario intenta vigilar el mismo juego en la misma tienda dos veces (la API debe devolver `409 Conflict`).

### US-HUNT-02: Recibir y gestionar alertas de precios

*   **Como** jugador,
*   **quiero** ver un feed de alertas claras cuando un juego que vigilo alcanza mi precio objetivo o un nuevo mínimo histórico,
*   **para** no perderme una buena oferta y comprar con confianza.

**Escenarios:**
*   El job diario del scheduler se ejecuta y detecta que "Elden Ring" en Steam ahora cuesta ARS$ 14.999.
*   El sistema genera una alerta tipo `target_reached`.
*   Un jugador abre Nexus y ve un ícono con un badge numérico de alertas no leídas.

**Criterios de Aceptación:**
*   [ ] Hay una sección en la UI (`/alertas`) que llama a `GET /api/hunter/alerts`.
*   [ ] Un ícono de navegación muestra un badge con la cantidad de alertas no leídas (`is_read: false`).
*   [ ] Cada alerta en el feed muestra el título del juego, la tienda, el precio que disparó la alerta y el tipo (`target_reached` o `historical_low`).
*   [ ] Al hacer clic en una alerta, se marca como leída (`POST /api/hunter/alerts/{id}/read`) y el badge se actualiza.
*   [ ] El sistema no genera alertas duplicadas para la misma condición (ej. si el precio sigue bajo el objetivo, no se crea una nueva alerta cada día).

**Casos Edge:**
*   Un juego es eliminado de la tienda. El "watch" debería quizás desactivarse o notificar al usuario.
*   La API de ITAD está caída cuando el scheduler se ejecuta. El job debe reintentar o registrar el fallo, pero no debe crashear.

---