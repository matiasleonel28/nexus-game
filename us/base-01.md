# US-BASE-01: Exportar e importar biblioteca en JSON

> **Epic:** Base · **Prioridad:** P2 · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-01 (debe haber datos que exportar)

## Historia

**Como** usuario  
**quiero** exportar mi biblioteca completa a JSON e importarla de vuelta  
**para** tener control total de mis datos y no quedar preso de la herramienta.

---

## Criterios de Aceptación

### AC-1: Exportar biblioteca
```gherkin
Dado que tengo juegos en mi biblioteca
Cuando presiono "Exportar" en configuración
Entonces se descarga un archivo nexus-backup-YYYY-MM-DD.json
  Y contiene todos mis juegos con: título, estado, plataforma, horas, disfrute, watches, alertas
```

### AC-2: Formato del export
```gherkin
Dado que exporté mi biblioteca
Cuando abro el JSON
Entonces tiene estructura legible con campos descriptivos
  Y incluye metadata: versión del formato, fecha de export, cantidad de juegos
```

### AC-3: Importar biblioteca
```gherkin
Dado que tengo un archivo nexus-backup.json válido
Cuando lo importo desde configuración
Entonces los juegos se cargan respetando duplicados (no sobreescribe)
  Y veo resumen "Importados: 15, Ya existían: 3, Errores: 0"
```

### AC-4: Validación de archivo
```gherkin
Dado que subo un archivo inválido (no JSON o formato incorrecto)
Cuando intento importar
Entonces veo error "Formato de archivo no válido"
  Y no se modifica nada en la biblioteca
```

### AC-5: Conflictos en import
```gherkin
Dado que importo un juego que ya existe (mismo igdb_id + plataforma)
Cuando se procesa el import
Entonces se mantiene la versión existente (no sobreescribe)
  Y se reporta en el resumen como "ya existía"
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Export con 20 juegos | JSON descargado con todos los datos |
| 2 | Happy | Import de backup válido | Juegos cargados, resumen visible |
| 3 | Sad | Biblioteca vacía + export | JSON con array vacío + metadata |
| 4 | Sad | Archivo corrupto (JSON malformado) | Error de validación |
| 5 | Sad | Archivo JSON válido pero formato incorrecto (no Nexus) | Error "Formato no reconocido" |
| 6 | Edge | Import con juegos duplicados | Skip duplicados, importar nuevos |
| 7 | Edge | Import de versión futura del formato | Warning "Versión más nueva, algunos campos pueden ignorarse" |
| 8 | Edge | Archivo muy grande (1000+ juegos) | Progress bar durante import |
| 9 | Border | Export/import sin conexión (modo offline) | Funciona (no requiere APIs externas) |

---

## Formato propuesto del JSON

```json
{
  "nexus_version": "1.0",
  "exported_at": "2026-07-10T12:00:00Z",
  "user_email": "matu@test.com",
  "games_count": 2,
  "games": [
    {
      "igdb_id": 7346,
      "title": "Hollow Knight",
      "platform": "pc",
      "status": "completado",
      "hours_played": 40,
      "enjoyment": 5,
      "hltb_main_hours": 25,
      "has_coop": false,
      "added_at": "2026-01-15T10:00:00Z",
      "watches": [
        { "store": "steam", "target_price": 5000 }
      ]
    }
  ]
}
```
