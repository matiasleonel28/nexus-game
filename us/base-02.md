# US-BASE-02: Preferencias de usuario (región y moneda)

> **Epic:** Base · **Prioridad:** P2 · **Estado impl:** ❌ No existe  
> **Dependencias:** AUTH-01

## Historia

**Como** usuario  
**quiero** que mi región (AR) y moneda (ARS) estén asociadas a mi cuenta  
**para** que los precios se muestren siempre en la moneda correcta.

---

## Criterios de Aceptación

### AC-1: Región por defecto
```gherkin
Dado que me registro como usuario nuevo
Cuando se crea mi cuenta
Entonces mi región es AR y mi moneda ARS por defecto
```

### AC-2: Ver preferencias
```gherkin
Dado que estoy logueado
Cuando accedo a /me o a configuración
Entonces veo mi región y moneda actuales
```

### AC-3: Editar preferencias (futuro)
```gherkin
Dado que quiero cambiar mi región
Cuando edito mis preferencias
Entonces los precios del Hunter se consultan con la nueva región
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Usuario nuevo → preferencias AR/ARS | Creado con defaults correctos |
| 2 | Happy | GET /me muestra región y moneda | Datos visibles |
| 3 | Edge | Backend usa preferencias en llamadas a ITAD/Nintendo | Región correcta en API calls |
| 4 | Border | Actualmente hardcodeado AR/ARS en todo el backend | Migrar a leer de user.region |

---

## Estado actualizado (julio 2026)
- **`region` y `currency` YA EXISTEN** en el modelo User (default AR / ARS).
- **`available_hours_per_week` y `stress_level_tolerance`** también agregados (para onboarding/recomendaciones).
- **PATCH /me** implementado para actualizar preferencias.
- **Falta**: página de perfil en el frontend para editar estas preferencias post-onboarding.
- **Falta**: que el backend use `user.region` en las llamadas a ITAD/Nintendo (sigue hardcodeado).
