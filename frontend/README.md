# Game Manager Frontend 🎮

Este es el cliente web para el sistema **Game Manager**, construido utilizando **React** y **Vite**. La interfaz está diseñada para gestionar colecciones personales de videojuegos, buscar nuevos títulos y administrar una lista de deseados (Wishlist), todo bajo una estética oscura moderna (`#0b0d12`) con acentos vibrantes (`#ff4655`).

## 🛠️ Tecnologías Utilizadas

- **Core:** React 19 + Vite
- **Enrutamiento:** React Router DOM (v7)
- **Cliente HTTP:** Axios
- **Estilos:** Tailwind CSS v4

## 📂 Estructura del Código

- `src/api/`: Configuración y clientes de Axios (`client.js`, `games.js`) para comunicarse con el backend (FastAPI).
- `src/components/`: Componentes de interfaz reutilizables, como `GameCard.jsx`.
- `src/context/`: Estado global de la aplicación (ej: `GameRefreshContext.jsx` para sincronizar las vistas tras actualizar la base de datos).
- `src/pages/`: Vistas principales de la aplicación:
  - `Dashboard.jsx`: Vista principal para ver el backlog o la colección.
  - `SearchView.jsx`: Buscador integrado con IGDB (a través de la API).
  - `WishlistView.jsx`: Gestión de juegos deseados.
  - `NotFound.jsx`: Página de error 404.

## 🚀 Inicio Rápido Local

Asegúrate de tener Node.js instalado en tu máquina.

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El frontend estará disponible de forma predeterminada en [http://localhost:5173](http://localhost:5173).

## 🔗 Integración con Backend

El frontend espera conectarse a la API de **Game Manager Backend**, la cual debería estar ejecutándose en `http://localhost:8000`. Si los endpoints no responden, asegúrate de haber levantado el entorno backend previamente.

## 🎨 Decisiones de Diseño

- **Lazy Loading / Ocultamiento de Datos:** Durante las búsquedas, detalles adicionales como las horas de juego (HowLongToBeat) y los precios de PC se ocultan para mantener una UI limpia. Solo se muestran una vez que el juego ha sido añadido a la colección del usuario.
- **Portadas Dinámicas:** Se transforman las URLs de miniaturas (`t_thumb`) de IGDB proporcionadas por el backend a su versión de portada grande (`t_cover_big`) directamente en el frontend para evitar descargas innecesarias a menos que se renderice el componente.
