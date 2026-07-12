# US-AUTH-02: Crear cuenta de usuario

> **Epic:** Auth · **Prioridad:** P0 · **Estado impl:** ⚠️ Parcial (UI en inglés)  
> **Dependencias:** Ninguna  
> **Bloquea:** AUTH-01

## Historia

**Como** jugador nuevo  
**quiero** registrarme con mi email y una contraseña  
**para** empezar a usar Nexus con mis datos protegidos.

---

## Criterios de Aceptación

### AC-1: Registro exitoso
```gherkin
Dado que no tengo cuenta
Cuando completo email y contraseña (mínimo 8 caracteres)
Entonces se crea mi cuenta con región AR y moneda ARS por defecto
  Y soy redirigido a /login con mensaje "Cuenta creada, iniciá sesión"
```

### AC-2: Email duplicado
```gherkin
Dado que ya existe una cuenta con "matu@test.com"
Cuando intento registrarme con ese email
Entonces veo error "Ya existe una cuenta con ese email"
  Y no se crea duplicado
```

### AC-3: Validación de contraseña
```gherkin
Dado que estoy completando el formulario de registro
Cuando ingreso una contraseña menor a 8 caracteres
Entonces veo feedback inline "Mínimo 8 caracteres"
  Y el botón de registro queda deshabilitado
```

### AC-4: UI en español
```gherkin
Dado que toda la app está en español
Cuando entro a /register
Entonces todos los labels, placeholders, botones y mensajes están en español
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Registro con datos válidos | Cuenta creada, redirect a login |
| 2 | Sad | Email ya registrado | Error 409 con mensaje claro |
| 3 | Sad | Email inválido (sin @) | Validación frontend "Email inválido" |
| 4 | Sad | Contraseña < 8 chars | Validación inline |
| 5 | Sad | Campos vacíos | Submit deshabilitado |
| 6 | Edge | Email con espacios al inicio/final | Se trimmea antes de enviar |
| 7 | Edge | Registro + login inmediato | Flujo completo sin fricciones |
| 8 | Border | Email unicode (ñ@dominio.com) | Rechazado con mensaje claro |
| 9 | Border | Password de exactamente 8 chars | Aceptado |

---

## Bug conocido
- **RegisterPage está en inglés.** Labels y textos deben traducirse a español.
