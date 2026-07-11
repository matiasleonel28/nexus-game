# US-INFRA-02: Traducir RegisterPage a español

> **Epic:** Infraestructura / UX · **Prioridad:** P1 · **Estado impl:** ❌ Bug conocido  
> **Dependencias:** AUTH-02

## Historia

**Como** jugador argentino  
**quiero** que la página de registro esté en español  
**para** que toda la app sea consistente en idioma.

---

## Criterios de Aceptación

### AC-1: Todos los textos en español
```gherkin
Dado que abro /register
Cuando veo la página
Entonces todos los labels, placeholders, botones y mensajes están en español:
  - "Crear cuenta" (título)
  - "Email" (label)
  - "Contraseña" (label)
  - "Confirmar contraseña" (label, si existe)
  - "Registrarse" (botón)
  - "¿Ya tenés cuenta? Iniciá sesión" (link)
  - Mensajes de error en español
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Abrir /register | Todo en español |
| 2 | Edge | Mensajes de error del backend | También en español |
| 3 | Border | Título del tab del browser | "Crear cuenta — Nexus" |
