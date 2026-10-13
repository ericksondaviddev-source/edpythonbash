import { test, expect, type Page } from '@playwright/test'

const MOD_F00 = 'F0.0 - Diagramas de Flujo'
const MOD_F02 = 'F0.2 - HTML/CSS Esencial'

const LEC_VIEW = 'Reconocer los cuatro símbolos y las flechas de un diagrama de flujo'
const LEC_BUILD = 'Construir un flujo secuencial de principio a fin'
const LEC_HTML = 'Estructura semántica'

/**
 * Abre una lección desde el panel lateral.
 * El módulo inicial (F0.0) arranca desplegado, así que solo se pulsa si está cerrado.
 */
async function openLesson(page: Page, moduleName: string, competencia: string) {
  await page.goto('/')
  const mod = page.getByRole('button', { name: moduleName, exact: true })
  await expect(mod).toBeVisible()
  if ((await mod.getAttribute('aria-expanded')) !== 'true') {
    await mod.click()
  }
  await page.getByRole('button', { name: competencia, exact: true }).click()
}

/** Abre la pestaña «Diagrama» de la lección actual. */
async function openDiagramTab(page: Page) {
  await page.getByRole('button', { name: 'Diagrama', exact: true }).click()
}

test.describe('Critical Flows', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Panel de Aprendizaje')).toBeVisible()
    await expect(page.getByText('Bienvenido de vuelta')).toBeVisible()
  })

  test('should display modules in sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: MOD_F02, exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '1.1 - Fundamentos Sólidos (Python)', exact: true })
    ).toBeVisible()
  })

  test('should list the flowchart module first', async ({ page }) => {
    await page.goto('/')
    const modules = await page.locator('aside button[aria-expanded]').allInnerTexts()
    expect(modules[0]).toContain(MOD_F00)
  })

  test('should navigate to lesson', async ({ page }) => {
    await openLesson(page, MOD_F02, LEC_HTML)
    await expect(page.getByText('Modelo Mental')).toBeVisible()
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Cambiar tema').click()
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
  })

  test('should toggle language', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByText('Learning Dashboard')).toBeVisible()
  })

  test('should answer a quiz question', async ({ page }) => {
    await openLesson(page, MOD_F02, LEC_HTML)
    await page.getByRole('button', { name: 'Quiz', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Pregunta 1\// })).toBeVisible()

    // El banco de preguntas mezcla quiz + quiz_ia, así que se responde la que toque.
    await page.getByRole('button', { name: /^A\./ }).click()
    await expect(page.getByText('¡Correcto!').or(page.getByText('Incorrecto'))).toBeVisible()
  })
})

test.describe('F0.0 · Diagramas de flujo', () => {
  test('el tab «Diagrama» solo aparece en lecciones de diagramas', async ({ page }) => {
    await openLesson(page, MOD_F00, LEC_VIEW)
    await expect(page.getByRole('button', { name: 'Diagrama', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Visual', exact: true })).toHaveCount(0)

    await openLesson(page, MOD_F02, LEC_HTML)
    await expect(page.getByRole('button', { name: 'Visual', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Diagrama', exact: true })).toHaveCount(0)
  })

  test('la vista de solo lectura pinta los símbolos del diagrama', async ({ page }) => {
    await openLesson(page, MOD_F00, LEC_VIEW)
    await openDiagramTab(page)

    const canvas = page.getByTestId('fc-canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas.getByRole('figure', { name: 'Inicio' })).toBeVisible()
    await expect(canvas.getByRole('figure', { name: 'Abrir la app' })).toBeVisible()
    await expect(canvas.getByRole('figure', { name: '¿Estás registrado?' })).toBeVisible()
    await expect(canvas.getByRole('figure', { name: 'Menú principal' })).toBeVisible()
  })

  test('el constructor ofrece paleta, lienzo y validación', async ({ page }) => {
    await openLesson(page, MOD_F00, LEC_BUILD)
    await openDiagramTab(page)

    const palette = page.getByRole('button', { name: 'Inicio', exact: true })
    await expect(palette).toBeVisible()
    await expect(page.getByRole('button', { name: 'Proceso', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Decisión', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fin', exact: true })).toBeVisible()

    // El lienzo arranca vacío y la validación explica qué falta.
    await expect(page.getByTestId('fc-status')).toHaveText('Revisar')
    await expect(page.getByText(/el lienzo está vacío/i)).toBeVisible()

    // Añadir un símbolo desde la paleta lo coloca en el lienzo.
    await palette.click()
    await expect(page.getByTestId('fc-canvas').getByRole('figure', { name: 'Inicio' })).toBeVisible()
  })

  test('el pseudocódigo se genera al pulsar «Ver código»', async ({ page }) => {
    await openLesson(page, MOD_F00, LEC_VIEW)
    await openDiagramTab(page)

    await page.getByRole('button', { name: 'Ver código', exact: true }).click()
    await expect(page.getByText('Traducción del diagrama')).toBeVisible()
    const blocks = await page.locator('pre').allInnerTexts()
    expect(blocks.some(b => b.includes('INICIO') && b.includes('Abrir la app') && b.includes('FIN SI'))).toBe(
      true
    )
  })

  test('la pestaña se traduce al cambiar de idioma', async ({ page }) => {
    await openLesson(page, MOD_F00, LEC_VIEW)
    await expect(page.getByRole('button', { name: 'Diagrama', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Diagram', exact: true })).toBeVisible()
  })
})
