# Sprint 1 — Plan Técnico de Implementación

> **User Stories:** UX-04, INFRA-02, UX-03
> **Generado:** 2026-07-10
> **Fuente:** `DEV_HANDOFF.md` + `us/ux-04.md` + `us/infra-02.md` + `us/ux-03.md`
> **Scope:** Solo frontend. Cero cambios de backend en este sprint.

---

## Orden de ejecución

```
1° UX-04 (Toast system)    — transversal, las demás lo usan
2° INFRA-02 (RegisterPage) — quick fix, usa toast para errores
3° UX-03 (Stats wording)   — quick fix de textos
```

---

## 1. UX-04 — Sistema de notificaciones Toast

**Referencia:** `us/ux-04.md`
**Estimación:** 2-3 horas

### Archivos a CREAR

#### `frontend/src/context/ToastContext.jsx`

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/Toast';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    const persistent = type === 'error';

    setToasts(prev => {
      const next = [...prev, { id, message, type, persistent }];
      // Stacking: max 3 visibles, descartar los más viejos
      return next.length > 3 ? next.slice(-3) : next;
    });

    if (!persistent) {
      setTimeout(() => removeToast(id), 4000);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}
```

#### `frontend/src/components/Toast.jsx`

```jsx
export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  const borderColor = {
    success: 'var(--positive)',
    error: 'var(--danger)',
    warning: 'var(--accent)',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
                     bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] text-sm
                     animate-[toast-in_0.25s_ease-out]"
          style={{ borderLeftWidth: '4px', borderLeftColor: borderColor[toast.type] || borderColor.success }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors shrink-0"
            aria-label="Cerrar"
          >
            {/* SVG X icon (Lucide) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### CSS — agregar en `frontend/src/App.css`

```css
@keyframes toast-in {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

### Archivos a MODIFICAR

#### `frontend/src/App.jsx`

Wrappear con `ToastProvider` afuera de `BrowserRouter` (disponible en login/register también):

```diff
+import { ToastProvider } from './context/ToastContext';

 export default function App() {
   return (
     <AuthProvider>
-      <BrowserRouter>
-        <AppRoutes />
-      </BrowserRouter>
+      <ToastProvider>
+        <BrowserRouter>
+          <AppRoutes />
+        </BrowserRouter>
+      </ToastProvider>
     </AuthProvider>
   )
 }
```

#### `frontend/src/pages/SearchView.jsx`

En los handlers de agregar juego a biblioteca/wishlist:

```diff
+import { useToast } from '../context/ToastContext';

 // Dentro del componente:
+const { addToast } = useToast();

 // En el handler de agregar a biblioteca (success):
-// (actualmente el feedback se pierde o queda invisible)
+addToast(`${game.name} agregado a tu Biblioteca`);

 // En el handler de agregar a wishlist (success):
+addToast(`${game.name} agregado a tu Wishlist`);

 // En catch:
+if (err.status === 409) {
+  addToast('Ya tenés este juego', 'warning');
+} else {
+  addToast(err.message, 'error');
+}
```

#### `frontend/src/pages/Dashboard.jsx`

En handlers de cambiar estado, cambiar plataforma, eliminar juego:

```diff
+import { useToast } from '../context/ToastContext';
+const { addToast } = useToast();

 // Cambiar estado — success:
+addToast('Estado actualizado');

 // Cambiar plataforma — success:
+addToast('Plataforma actualizada');

 // Eliminar — success (post ConfirmDialog):
+addToast('Juego eliminado');

 // Todos los catch:
+addToast(err.message, 'error');
```

#### `frontend/src/pages/WishlistView.jsx`

```diff
+import { useToast } from '../context/ToastContext';
+const { addToast } = useToast();

 // Crear watch — success:
+addToast('Vigilancia creada');

 // Catch:
+addToast(err.message, 'error');
```

#### `frontend/src/pages/AlertsView.jsx`

```diff
+import { useToast } from '../context/ToastContext';
+const { addToast } = useToast();

 // Marcar alerta como leída — success:
+addToast('Alerta marcada como leída');
```

#### `frontend/src/components/UserOnboarding.jsx`

```diff
+import { useToast } from '../context/ToastContext';
+const { addToast } = useToast();

 // Guardar perfil — success:
+addToast('Perfil guardado');
```

### Validación UX-04

| Scenario | Qué verificar |
|----------|---------------|
| Agregar juego | Toast verde "Juego agregado" aparece abajo-derecha |
| Error de red | Toast rojo persiste hasta cerrarlo con X |
| Duplicado 409 | Toast ámbar "Ya tenés este juego" |
| 5 acciones rápidas | Solo 3 toasts visibles, stack vertical |
| Toast + ConfirmDialog | Ambos visibles, z-index sin conflicto (toast z-50, dialog z-40) |
| Auto-dismiss | Toasts de éxito desaparecen a los 4 segundos |

---

## 2. INFRA-02 — Traducir RegisterPage a español

**Referencia:** `us/infra-02.md`
**Estimación:** 30 min

### Estado actual

`RegisterPage.jsx` ya está mayormente en español. Los textos actuales:
- "Crear una cuenta" (label)
- "Correo electrónico" / "Contraseña" / "Confirmar contraseña" (labels)
- "Registrarse" (botón)
- "¿Ya tenés cuenta? Iniciá sesión" (link)
- Errores en español

### Archivo a MODIFICAR

#### `frontend/src/pages/RegisterPage.jsx`

```diff
+import { useEffect } from 'react';
+import { useToast } from '../context/ToastContext';

 export default function RegisterPage() {
+  const { addToast } = useToast();
+
+  useEffect(() => { document.title = 'Crear cuenta — Nexus'; }, []);

   // Línea 45 — quitar artículo:
-  <h3 ...>Crear una cuenta</h3>
+  <h3 ...>Crear cuenta</h3>

   // En el catch de handleSubmit — agregar toast para error:
   } catch (err) {
-    console.error("Registration error:", err);
     if (err.detail === 'Email ya registrado') {
       setError('Este email ya está en uso. Por favor, intenta iniciar sesión.');
     } else {
       setError(err.message || 'Ocurrió un error inesperado durante el registro.');
     }
+    addToast(error || err.message, 'error');
   }
```

### Validación INFRA-02

| Scenario | Qué verificar |
|----------|---------------|
| Abrir /register | Todos los textos en español |
| Tab del browser | Dice "Crear cuenta — Nexus" |
| Error de backend | Mensaje en español |

---

## 3. UX-03 — Mejorar Stats wording

**Referencia:** `us/ux-03.md`
**Estimación:** 30 min

### Archivo a MODIFICAR

#### `frontend/src/components/StatsChart.jsx`

**Cambio 1 — Título del donut chart (línea 47):**
```diff
-  Reality Check (Tasa de Finalización)
+  Tasa de Finalización
```

**Cambio 2 — Label central del donut (línea 82):**
```diff
-  <span ...>Win Rate</span>
+  <span ...>Completados</span>
```

**Cambio 3 — Título del bar chart (línea 91):**
```diff
-  Géneros Más Frustrantes
+  Géneros que más abandonás
```

**Cambio 4 — Sección colapsable (AC-4):**

Wrappear todo el return con un disclosure toggle:

```diff
+import { useState } from 'react';  // ya importado, agregar si falta

 export default function StatsChart() {
+  const [isOpen, setIsOpen] = useState(true);
   // ... data fetching ...

   return (
-    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
+    <div className="mb-8">
+      <button
+        onClick={() => setIsOpen(!isOpen)}
+        className="flex items-center gap-2 text-sm font-bold text-[var(--text)]
+                   uppercase tracking-wider mb-4 hover:text-[var(--accent)] transition-colors"
+      >
+        {/* Chevron SVG que rota */}
+        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
+             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
+             className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
+          <polyline points="9 18 15 12 9 6" />
+        </svg>
+        Mis Stats
+      </button>
+
+      {isOpen && (
+        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* ... donut chart + bar chart sin cambios estructurales ... */}
+        </div>
+      )}
+    </div>
   );
 }
```

### Validación UX-03

| Scenario | Qué verificar |
|----------|---------------|
| Dashboard con juegos completados+abandonados | Donut con "Tasa de Finalización", label "Completados" |
| Dashboard con abandonados con género | Bar chart dice "Géneros que más abandonás" |
| Click en "Mis Stats" | Sección se colapsa/expande |
| 0 juegos completados/abandonados | Mensaje vacío, sin chart roto |

---

## Resumen de archivos

| Acción | Archivo | US |
|--------|---------|----|
| CREAR | `frontend/src/context/ToastContext.jsx` | UX-04 |
| CREAR | `frontend/src/components/Toast.jsx` | UX-04 |
| MODIFICAR | `frontend/src/App.css` (keyframe) | UX-04 |
| MODIFICAR | `frontend/src/App.jsx` (ToastProvider) | UX-04 |
| MODIFICAR | `frontend/src/pages/SearchView.jsx` (useToast) | UX-04 |
| MODIFICAR | `frontend/src/pages/Dashboard.jsx` (useToast) | UX-04 |
| MODIFICAR | `frontend/src/pages/WishlistView.jsx` (useToast) | UX-04 |
| MODIFICAR | `frontend/src/pages/AlertsView.jsx` (useToast) | UX-04 |
| MODIFICAR | `frontend/src/components/UserOnboarding.jsx` (useToast) | UX-04 |
| MODIFICAR | `frontend/src/pages/RegisterPage.jsx` (título + document.title) | INFRA-02 |
| MODIFICAR | `frontend/src/components/StatsChart.jsx` (3 textos + colapsable) | UX-03 |

**Total:** 2 archivos nuevos + 9 archivos modificados. Todo frontend. Cero backend.

---

## Notas para el implementador

1. **Design tokens obligatorios.** Nunca hex sueltos. Usar `var(--positive)`, `var(--danger)`, `var(--accent)`, `var(--surface)`, etc.
2. **No emojis como iconos.** Toast usa SVG para la X de cerrar (Lucide `x`). Stats usa SVG para el chevron.
3. **Tipografía.** Los porcentajes del donut chart ya usan `.font-num` (Space Mono). No tocar eso.
4. **z-index.** Toast container: `z-50`. ConfirmDialog existente: verificar que use `z-40` o menos para que no tape toasts.
5. **Toast no bloqueante.** El wrapper del container es `pointer-events-none`, cada toast individual es `pointer-events-auto`.
6. **RegisterPage.** El archivo ya está en español — solo ajustar el título "Crear cuenta" (sin artículo) y agregar `document.title`.
7. **HANDOFF.md** menciona que hay que revertir models.py/backlog.py. Eso es un blocker de la app en general pero NO de este sprint (todo es frontend). Verificar que el backend funciona antes de testear.
