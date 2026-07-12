# US-AUTH-03: Recuperar contraseña olvidada

> **Epic:** Auth · **Prioridad:** P1 · **Estado impl:** ✅ Completo  
> **Dependencias:** AUTH-02 (debe existir la cuenta)

## Historia

**Como** jugador que olvidó su contraseña  
**quiero** solicitar un reset por email  
**para** recuperar el acceso a mi cuenta sin perder datos.

---

## Criterios de Aceptación

### AC-1: Solicitar reset
```gherkin
Dado que tengo una cuenta registrada
Cuando ingreso mi email en /forgot-password y presiono "Enviar"
Entonces se genera un token de reset (válido 15 minutos)
  Y veo mensaje "Si el email existe, recibirás instrucciones"
```

### AC-2: Resetear contraseña
```gherkin
Dado que tengo un token de reset válido
Cuando accedo a /reset-password?token=xxx e ingreso nueva contraseña
Entonces mi contraseña se actualiza
  Y soy redirigido a /login con mensaje "Contraseña actualizada"
```

### AC-3: Token expirado
```gherkin
Dado que mi token de reset tiene más de 15 minutos
Cuando intento usarlo
Entonces veo error "El enlace expiró. Solicitá uno nuevo."
  Y tengo link para volver a /forgot-password
```

### AC-4: Seguridad — no revelar existencia de email
```gherkin
Dado que ingreso un email que NO existe en el sistema
Cuando solicito reset
Entonces veo el mismo mensaje genérico "Si el email existe, recibirás instrucciones"
  Y no se revela si la cuenta existe o no
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Solicitar reset + usar token + nueva contraseña | Login exitoso con nueva pass |
| 2 | Sad | Token expirado (>15min) | Error con link a forgot-password |
| 3 | Sad | Token ya usado | Error "Enlace ya utilizado" |
| 4 | Sad | Email inexistente en forgot | Mismo mensaje genérico (seguridad) |
| 5 | Edge | Solicitar dos tokens seguidos | Solo el último es válido |
| 6 | Edge | Nueva contraseña igual a la anterior | Permitido (no forzamos historial) |
| 7 | Border | Token manipulado/inválido | Error 401 "Enlace inválido" |
