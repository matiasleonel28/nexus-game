# US-HUNT-05: Integrar Steamcito como fuente de precios

## Historia
Como jugador argentino, quiero ver precios de Steam en pesos argentinos con impuestos incluidos desde Steamcito, para tener una fuente de precios mas precisa y local.

## Criterios de Aceptacion

### AC-1: Servicio Steamcito funcional
```gherkin
Dado que existe el modulo services/steamcito.py
Cuando se consulta un juego por su Steam App ID
Entonces se obtiene el precio en ARS con impuestos incluidos
  Y se retorna el precio final, el precio base y el porcentaje de descuento si aplica
```

### AC-2: Integracion en prices_hub
```gherkin
Dado que prices_hub.py orquesta las fuentes de precios
Cuando se buscan precios para un juego disponible en Steam
Entonces se consultan tanto ITAD como Steamcito
  Y se unifican los resultados sin duplicar la entrada de Steam
```

### AC-3: Deduplicacion de precios Steam
```gherkin
Dado que ITAD y Steamcito retornan precio para el mismo juego en Steam
Cuando prices_hub consolida los resultados
Entonces se muestra una unica entrada para Steam
  Y se prioriza el precio de Steamcito por ser mas preciso en ARS
  Y se indica la fuente utilizada
```

### AC-4: Fallback cuando Steamcito no responde
```gherkin
Dado que Steamcito no esta disponible o responde con error
Cuando prices_hub consulta precios
Entonces se usa el precio de ITAD para Steam como fallback
  Y se loguea el error de Steamcito sin interrumpir la consulta
```

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Precio encontrado en Steamcito | app_id valido, Steamcito OK | Retorna precio ARS con impuestos |
| 2 | Happy | Ambas fuentes responden | juego en Steam, ITAD y Steamcito OK | Una sola entrada Steam, precio de Steamcito |
| 3 | Happy | Juego con descuento | juego en oferta en Steam | Muestra precio base, final y % descuento |
| 4 | Sad | Steamcito caido | Steamcito timeout/500 | Fallback a ITAD, log del error |
| 5 | Sad | Juego no existe en Steam | app_id inexistente | Steamcito retorna vacio, no se agrega entrada |
| 6 | Sad | Juego no tiene precio regional | juego sin precio ARS en Steam | Steamcito retorna sin datos, se usa ITAD si tiene |
| 7 | Edge | ITAD y Steamcito caidos | ambos servicios no responden | Lista de precios vacia para Steam, sin crash |
| 8 | Edge | Precios difieren significativamente | ITAD dice $5000, Steamcito dice $8000 (con imp.) | Se usa Steamcito, el con impuestos es el real |
| 9 | Edge | Rate limiting de Steamcito | muchas consultas seguidas | Respetar rate limit, reintentar con backoff |

## Edge / Border Cases
- Steamcito puede cambiar su estructura HTML/API sin aviso: el scraper necesita tests que detecten cambios de formato rapidamente.
- Los impuestos argentinos cambian periodicamente (IVA, impuesto PAIS, percepcion de ganancias): Steamcito los calcula, pero conviene loguear el desglose si esta disponible.
- Juegos free-to-play: Steamcito puede retornar precio $0, que es valido y no debe filtrarse.
- Juegos con multiples ediciones (standard, deluxe): mapear correctamente el app_id a la edicion consultada.

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: M
- Depende de: HUNT-01
