import { test, expect } from '@playwright/test';

test('Flujo feliz: Buscar juego, agregarlo al backlog y verificar visualización condicional', async ({ page }) => {
  // 1. Abrir la app en la ruta de búsqueda
  await page.goto('/search');

  // 2. Buscar un juego (Ej: Hollow Knight)
  const searchInput = page.getByPlaceholder(/BUSCAR EN LA BASE DE DATOS/i);
  await searchInput.fill('Hollow Knight');
  await page.getByRole('button', { name: /Buscar/i }).click();

  // 3. Verificar GameCard en SearchView
  const firstCard = page.locator('.group').first(); 
  await expect(firstCard.getByAltText(/Carátula de/i)).toBeVisible();

  // VALIDACIÓN DE NEGOCIO: HLTB y Precios deben permanecer OCULTOS en la búsqueda
  await expect(firstCard.getByText('Main Story')).not.toBeVisible();
  await expect(firstCard.getByText('100%')).not.toBeVisible();

  // 4. Agregar al Backlog
  const addToBacklogBtn = firstCard.getByRole('button', { name: /Añadir Backlog/i });
  await addToBacklogBtn.click();

  // Esperar a que salga la notificación de éxito en la UI
  // Le damos un timeout extendido (20 segundos) porque el backend tiene que consultar a IGDB, HLTB y CheapShark
  const successMessage = page.getByText(/¡Juego añadido a tu Backlog exitosamente!/i);
  await expect(successMessage).toBeVisible({ timeout: 20000 });

  // 5. Ir al Dashboard (/)
  await page.goto('/');

  // Verificar que el juego cargue en el Backlog
  const dashboardCard = page.locator('.group').first();
  await expect(dashboardCard).toBeVisible();
  
  // VALIDACIÓN DE NEGOCIO: Ahora SÍ se deben ver las horas (HLTB) y el botón actualizado
  await expect(dashboardCard.getByText('Main Story')).toBeVisible();
  await expect(dashboardCard.getByText('100%')).toBeVisible();
  
  const finishBtn = dashboardCard.getByRole('button', { name: /Marcar Terminado/i });
  await expect(finishBtn).toBeVisible();
});
