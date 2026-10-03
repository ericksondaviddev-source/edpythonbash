import { test, expect } from '@playwright/test'

test.describe('Critical Flows', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Panel de Aprendizaje')).toBeVisible()
    await expect(page.getByText('Bienvenido de vuelta')).toBeVisible()
  })

  test('should display modules in sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('F0.1 - HTML/CSS Esencial')).toBeVisible()
    await expect(page.getByText('1.1 - Fundamentos Sólidos (Python)')).toBeVisible()
  })

  test('should navigate to lesson', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Estructura semántica').click()
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
    await page.getByText('EN').click()
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should complete quiz', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Estructura semántica').click()
    await page.getByText('Quiz').click()
    await page.getByText('Le indica al navegador y herramientas de asistencia que es una región de navegación').click()
    await expect(page.getByText('¡Correcto!')).toBeVisible()
  })
})
