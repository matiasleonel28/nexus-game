# US-AUTH-01: Iniciar sesión y gestión de sesión

> **Epic:** Auth · **Prioridad:** P0 · **Estado impl:** ✅ Completo  
> **Dependencias:** Ninguna (es prerequisito de todo)

## Historia

**Como** jugador registrado  
**quiero** iniciar sesión con mi email y contraseña  
**para** acceder a mi biblioteca y mis datos de forma segura.

---

## Criterios de Aceptación

### AC-1: Login exitoso
```gherkin
Dado que tengo una cuenta registrada con email "matu@test.com"
Cuando ingreso email y contraseña correctos
Entonces recibo un access token (60min) y un refresh token (7 días)
  Y soy redirigido al Dashboard
```

### AC-2: Recordarme
```gherkin
Dado que estoy en la pantalla de login
Cuando marco "Recordarme" y me logueo exitosamente
Entonces los tokens se guardan en localStorage (persisten al cerrar)
  Y si no marco "Recordarme", se guardan en sessionStorage (se pierden al cerrar)
```

### AC-3: Refresh automático de token
```gherkin
Dado que mi access token expiró pero mi refresh token sigue vigente
Cuando hago cualquier request a la API
Entonces el interceptor renueva el access token automáticamente
  Y el request original se reintenta transparentemente
```

### AC-4: Sesión expirada
```gherkin
Dado que tanto mi access token como mi refresh token expiraron
Cuando hago cualquier request a la API
Entonces soy redirigido a /login
  Y veo un mensaje "Tu sesión expiró, iniciá sesión de nuevo"
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Login con credenciales válidas | Dashboard con biblioteca |
| 2 | Happy | Login con "Recordarme" + cerrar/abrir browser | Sigue logueado |
| 3 | Sad | Email no registrado | Error "Credenciales inválidas" (no revela si el email existe) |
| 4 | Sad | Password incorrecto | Error "Credenciales inválidas" |
| 5 | Sad | Campos vacíos | Validación frontend impide submit |
| 6 | Edge | Token expirado durante navegación | Refresh transparente, sin interrupción |
| 7 | Edge | Refresh token expirado | Redirect a /login con mensaje |
| 8 | Edge | Múltiples tabs abiertas, una hace logout | Las otras redirigen a login en su próximo request |
| 9 | Border | Email con mayúsculas ("Matu@Test.com") | Login exitoso (case-insensitive) |
| 10 | Border | Password con caracteres especiales (ñ, émojis) | Login exitoso |

---

## Notas de implementación
- Backend usa `OAuth2PasswordRequestForm` → frontend envía `application/x-www-form-urlencoded` con campo `username` (no `email`).
- Tres secrets separados: `SECRET_KEY`, `REFRESH_SECRET_KEY`, `PASSWORD_RESET_SECRET_KEY`.
