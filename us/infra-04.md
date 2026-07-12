# US-INFRA-04: Configurar Alembic con migraciones reales

## Historia
Como jugador, quiero que los cambios al esquema de la base de datos se manejen con migraciones versionadas para que las actualizaciones no rompan mis datos.

## Criterios de Aceptacion

### AC-1: Crear estructura de directorios de Alembic
```gherkin
Dado que alembic.ini existe pero no hay directorio alembic/versions/
Cuando se inicializa la estructura
Entonces existe alembic/env.py apuntando al Base de models.py
Y existe alembic/versions/ como directorio vacio
Y alembic/script.py.mako esta configurado
```

### AC-2: Generar migracion inicial desde el esquema actual
```gherkin
Dado que la estructura de Alembic esta configurada
Cuando se ejecuta alembic revision --autogenerate -m "initial"
Entonces se genera un archivo de migracion en alembic/versions/
Y el archivo contiene las tablas definidas en models.py
```

### AC-3: Migracion inicial se aplica correctamente
```gherkin
Dado que existe la migracion inicial generada
Cuando se ejecuta alembic upgrade head en una base nueva
Entonces se crean todas las tablas del esquema actual
Y alembic_version registra la revision aplicada
```

### AC-4: Downgrade funciona
```gherkin
Dado que la migracion inicial fue aplicada
Cuando se ejecuta alembic downgrade -1
Entonces se eliminan las tablas creadas por la migracion
Y la base queda en estado pre-migracion
```

### AC-5: Documentar workflow de migraciones
```gherkin
Dado que Alembic esta configurado y funcionando
Cuando se documenta el workflow en CLAUDE.md
Entonces CLAUDE.md incluye los comandos para crear, aplicar y revertir migraciones
Y explica como conectar env.py con la config de la DB
```

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Autogenerate detecta esquema | alembic revision --autogenerate | Genera migracion con todas las tablas de models.py |
| 2 | Happy | Upgrade en base limpia | alembic upgrade head | Tablas creadas, version registrada |
| 3 | Happy | Downgrade limpio | alembic downgrade base | Tablas eliminadas |
| 4 | Happy | Upgrade es idempotente | alembic upgrade head (ya aplicado) | No hace nada, sin error |
| 5 | Sad | DB URL no configurada | alembic upgrade head sin DATABASE_URL | Error claro indicando que falta la config |
| 6 | Sad | Modelo con conflicto | Dos migraciones con el mismo down_revision | Alembic reporta error de branch |
| 7 | Happy | Migracion futura funciona | Agregar campo nuevo a models.py + autogenerate | Nueva migracion detecta el campo agregado |

## Edge / Border Cases
- Si la base de datos de desarrollo ya tiene tablas, `alembic stamp head` marca la version actual sin recrear nada.
- El env.py debe leer DATABASE_URL de la misma config que usa la app (no hardcodear).
- Si se usa SQLite en desarrollo, algunas operaciones ALTER TABLE no estan soportadas; considerar batch mode de Alembic.
- Las migraciones deben commitearse al repo; agregar alembic/versions/ al .gitignore seria un error.
- Esta US bloquea MAN-05 (agrega hours_played/enjoyment) y UX-01 (agrega preferred_genres) porque sin migraciones esos cambios de modelo no se pueden aplicar de forma controlada.

## Estado
- Implementado: No
- Prioridad: P1
- Esfuerzo: M
- Depende de: -
