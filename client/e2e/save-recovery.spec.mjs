import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
const api = 'http://127.0.0.1:4010/api/v1'

test('Project history/comment retries preserve input and a delayed note save respects subsequent navigation', async ({
  page,
}) => {
  test.setTimeout(90_000)
  const registered = await page.request.post(`${api}/auth/register`, {
    data: {
      fullName: 'Recovery Tester',
      email: `recovery-${randomUUID()}@example.com`,
      password: 'ClientTest2026!',
    },
  })
  expect(registered.status()).toBe(201)
  const { data: auth } = await registered.json()
  const headers = { Authorization: `Bearer ${auth.token}` }
  const projectResponse = await page.request.post(`${api}/projects`, {
    headers,
    data: { name: 'Recovery project' },
  })
  const { data: project } = await projectResponse.json()
  const noteResponse = await page.request.post(`${api}/notes`, {
    headers,
    data: { title: 'Slow save note', content: 'Saved source' },
  })
  const { data: note } = await noteResponse.json()
  await page.goto('/login')
  await page.evaluate((token) => sessionStorage.setItem('devtrack.session', token), auth.token)
  let failHistory = true,
    failComment = true
  await page.route(`**/api/v1/projects/${project.id}/activities**`, (route) => {
    const fail = route.request().method() === 'POST' ? failComment : failHistory
    return fail
      ? route.fulfill({
          status: 503,
          json: { success: false, error: 'Temporary activity failure', code: 'TEST_FAILURE' },
        })
      : route.continue()
  })
  await page.goto(`/projects/${project.id}`)
  const activity = page.getByRole('region', { name: 'Project activity' })
  await expect(activity.getByRole('alert')).toContainText('Temporary activity failure')
  failHistory = false
  await activity.getByRole('button', { name: 'Try again' }).click()
  await expect(activity.getByText('Project created', { exact: true })).toBeVisible()
  await page.getByLabel('Add a comment').fill('Keep this failed comment')
  await page.getByRole('button', { name: 'Add comment', exact: true }).click()
  await expect(activity.getByRole('alert')).toContainText('Temporary activity failure')
  await expect(page.getByLabel('Add a comment')).toHaveValue('Keep this failed comment')
  failComment = false
  await page.getByRole('button', { name: 'Add comment', exact: true }).click()
  await expect(
    activity.getByRole('listitem').filter({ hasText: 'Keep this failed comment' }),
  ).toBeVisible()
  await page.goto(`/notes/${note.id}/edit`)
  await page.getByLabel('Note title').fill('A completed late save')
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route(`**/api/v1/notes/${note.id}`, async (route) => {
    if (route.request().method() !== 'PUT') return route.continue()
    const response = await route.fetch()
    await gate
    await route.fulfill({ response })
  })
  const requested = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith(`/notes/${note.id}`),
  )
  const responded = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' && response.url().endsWith(`/notes/${note.id}`),
  )
  try {
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await requested
    await page.getByRole('link', { name: 'Projects', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  } finally {
    release()
  }
  expect((await responded).status()).toBe(200)
  await expect(page.getByText('Changes saved', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/projects$/)
  const persisted = await page.request.get(`${api}/notes/${note.id}`, { headers })
  expect((await persisted.json()).data.title).toBe('A completed late save')
  await page.goto('/settings/appearance')
  await page.getByRole('radio', { name: 'Dark', exact: true }).locator('..').click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/projects/${project.id}`)
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Project activity' })
      .getByText('Project created', { exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'test-results/projects-dark-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto(`/notes/${note.id}`)
  await expect(
    page.getByRole('heading', { name: 'A completed late save', exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'test-results/notes-dark-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
