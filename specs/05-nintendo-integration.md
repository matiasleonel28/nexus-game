# Nexus — Integración de precios de Nintendo eShop (ARS)

> **Fase Hunter · investigación + decisión** · Estado: `IMPLEMENTADO`
> Última edición: 2026-07-09

## Estado de implementación (verificado E2E)
- `services/nintendo.py`: `extract_nsuid(url)` (nsuid = el número de 14 díg.
  `70…` más frecuente de la página; validado 157 vs 13 en BOTW) + `get_eshop_price(nsuid)`.
- `services/prices_hub.py`: combina ITAD (steam/xbox) + Nintendo (eshop) por juego.
- `games.eshop_nsuid` cacheado; `POST /api/hunter/eshop/resolve`, `GET /api/hunter/game/{id}/prices`.
- Frontend: vinculador de eShop en la tarjeta de Wishlist (pegar link US).
- Prueba real: Donkey Kong Bananza → nsuid `70010000096809` → **ARS 99.199**.
- Pendiente menor: confirmar el formato exacto de `discount_price` con un juego
  en oferta (el parseo ya lo contempla vía `raw_value`).


## Problema

ITAD (la fuente del Hunter) cubre **Steam + Xbox** en ARS, pero **casi no cubre
Nintendo eShop** (verificado: Zelda TotK, Donkey Kong Bananza, Splatoon Raiders →
"sin datos"). Nintendo es el hueco a llenar.

## Investigación (todo verificado en vivo, 2026-07-09)

### Lo que SÍ funciona
- **API de precios propia de Nintendo**: `GET https://api.ec.nintendo.com/v1/price?country=AR&lang=es&ids=<nsuid>`
  - Gratis, sin API key, estable hace años.
  - Devuelve **pesos nativos**. Prueba real: Zelda BOTW (nsuid NA `70010000000025`)
    → `regular_price: {amount: "$84.999,00", currency: "ARS", raw_value: "84999"}`.
  - Incluye `discount_price` cuando el juego está en oferta, y `sales_status`.
- **El eShop de Argentina cotiza nativo en ARS** (Q&A oficial de Nintendo para
  AR/CL/CO/PE). No es conversión: es precio local real.

### El blocker
La API necesita el **nsuid de la región Américas** (US). Conseguirlo automático
por título es lo frágil:
- **Búsqueda de Nintendo of America (Algolia)**: migró. App id `U3B6GR4UA3` y todas
  las keys probadas (viejas + las extraídas del sitio hoy) → **403 "Invalid
  Application-ID or API key"**. Perseguir keys = se rompe de nuevo.
- **Búsqueda de Nintendo of Europe** (`searching.nintendo-europe.com`): abierta,
  sin keys, estable — **pero da nsuids europeos**, que en AR dan `not_found`
  (probado con Hollow Knight EU `70010000003207` y los 2 nsuids de Donkey Kong
  Bananza). No sirven para precio AR.

### Fuentes evaluadas
| Fuente | eShop ARS | Mín. histórico | API pública | Costo |
|---|---|---|---|---|
| **API Nintendo** (elegida) | ✅ nativo | ❌ (lo construimos) | ✅ no oficial, estable | Gratis |
| eshop-prices.com | ✅ | ✅ | ❌ scraping | Gratis |
| Dekudeals | ✅ | ✅ | ❌ (piden API hace años) | — |
| PSprices B2B | ✅ | ✅ | ✅ | 💲 pago |

## Decisión

1. **Precio**: API propia de Nintendo (`country=AR`). Durable, real, gratis.
2. **Resolución de nsuid** (elegido por el dueño): **scrape puntual por link**.
   El usuario pega el link del juego en el eShop de EE.UU.; se extrae el nsuid de
   esa página (páginas de producto = estables, más robusto que un search index
   con keys que rotan) y se **cachea** en el juego. No se repite salvo que cambie.
3. **Mínimo histórico eShop**: Nintendo no lo da. Se **auto-construye** con el job
   diario guardando cada precio en `price_history`.

## Plan de implementación

### Backend
- `services/nintendo.py`:
  - `extract_nsuid(url) -> str | None` — baja la página de producto US y extrae el
    nsuid (probablemente del JSON embebido `__NEXT_DATA__` / structured data).
    **[PENDIENTE de verificar la ubicación exacta del nsuid en el HTML.]**
  - `get_eshop_price(nsuid) -> dict` — llama a la API de precios `country=AR` y
    normaliza a `{current, currency, cut, regular}` (usa `raw_value`).
- Modelo `games`: nuevo campo `eshop_nsuid` (String, nullable) [+ opcional `eshop_url`].
- `routers/hunter.py`: endpoint `POST /hunter/eshop/resolve` (body: url) → extrae y
  guarda el nsuid en el juego.
- `get_prices` del Hunter: si el juego tiene `eshop_nsuid`, agrega la tienda
  `eshop` con el precio de Nintendo (junto a steam/xbox de ITAD).
- `price_history`: registrar cada evaluación para armar el mínimo histórico propio.

### Frontend
- En la tarjeta (Wishlist/Hunter): input "link del eShop US" → botón "Resolver" →
  guarda el nsuid → muestra el precio ARS del eShop igual que las otras tiendas.

## Pendiente antes de codear
- Verificar dónde vive el nsuid en la página de producto de nintendo.com/us
  (bloqueado temporalmente por un corte del clasificador de red en la sesión).
- Confirmar el formato de descuento (`discount_price`) con un juego en oferta.
