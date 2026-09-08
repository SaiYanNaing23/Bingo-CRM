import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://127.0.0.1:4010/api/v1'
const password = 'ClientTest2026!'

test.describe('shadcn controls across timezones', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })
  test('calendar, time input, dropdown filters, and collapsible sidebar preserve API behavior', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const { token } = await account(page)
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
    await expect(page.locator('[data-slot="sidebar"][data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    )
    await page.reload()
    await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Today', exact: true }).hover()
    await expect(page.getByRole('tooltip')).toContainText('Today')
    await page.screenshot({ path: 'test-results/sidebar-collapsed-desktop.png', fullPage: true })
    await page.getByRole('link', { name: 'Today', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Today', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await page.keyboard.press('Control+b')
    await expect(page.getByRole('button', { name: 'Collapse sidebar', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Appearance' }).click()
    await page.getByRole('radio', { name: 'Dark', exact: true }).locator('..').click()
    await page.goto('/tasks/new')
    await page.getByLabel('Task title').fill('Calendar selection in Yangon')
    await page.keyboard.press('Control+b')
    await expect(page.getByRole('button', { name: 'Collapse sidebar', exact: true })).toBeVisible()
    await selectTimezone(page, 'Timezone', 'Asia/Yangon')
    await fillDateTime(page, 'Due date', '2026-09-08T10:15:37')
    await page.getByRole('button', { name: 'Open calendar for due date' }).click()
    await expect(page.getByRole('dialog', { name: 'Due date calendar' })).toBeVisible()
    await selectChoice(page, 'Choose the Year', '2027')
    await selectChoice(page, 'Choose the Month', 'Feb')
    await page.screenshot({ path: 'test-results/calendar-dark-desktop.png', fullPage: true })
    await page.getByRole('button', { name: 'Sunday, February 28th, 2027', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Due date', exact: true })).toHaveValue(
      '2027-02-28',
    )
    await expect(page.getByLabel('Due date time', { exact: true })).toHaveValue('10:15:37')
    await expect(page.getByRole('dialog', { name: 'Due date calendar' })).not.toBeVisible()
    const created = page.waitForResponse(
      (response) => response.url().endsWith('/tasks') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Create task', exact: true }).click()
    const result = await created
    expect(result.status()).toBe(201)
    const { data } = await result.json()
    expect(data.dueDate).toBe('2027-02-28T03:45:37.000Z')
    expect(data.timezone).toBe('Asia/Yangon')
    await expect(
      page.getByRole('heading', { name: 'Calendar selection in Yangon', exact: true }),
    ).toBeVisible()
    const original = '2027-02-28T03:45:37.123Z'
    const seeded = await page.request.put(`${api}/tasks/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { dueDate: original },
    })
    expect(seeded.status()).toBe(200)
    await page.goto(`/tasks/${data.id}/edit`)
    await page.getByLabel('Task title').fill('Exact timestamp preserved')
    const updated = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/tasks/${data.id}`) && response.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    expect((await (await updated).json()).data.dueDate).toBe(original)
    await page.goto('/tasks')
    await selectChoice(page, 'Rows per page', '10 / page')
    await expect(page).toHaveURL(/limit=10/)
    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    await selectChoice(page, 'Status', 'To do')
    await expect(page).toHaveURL(/status=TODO/)
    await fillDateTime(page, 'Due from', '2027-02-27T00:00')
    await page.getByRole('button', { name: 'Apply due from' }).click()
    await expect(page).toHaveURL(/dueDateFrom=2027-02-27T08%3A00%3A00.000Z/)
    await expect(
      page.getByRole('link', { name: 'Exact timestamp preserved', exact: true }),
    ).toBeVisible()
    await selectChoice(page, 'Status', 'All')
    await expect(page).not.toHaveURL(/status=/)
    await page.goto(`/tasks/${data.id}/edit`)
    await page.getByRole('button', { name: 'Clear due date' }).click()
    const cleared = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/tasks/${data.id}`) && response.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    expect((await (await cleared).json()).data.dueDate).toBeNull()

    await page.goto('/tasks/new')
    await page.getByLabel('Task title').fill('Daylight saving validation')
    await selectTimezone(page, 'Timezone', 'America/New_York')
    await fillDateTime(page, 'Due date', '2026-03-08T02:30')
    await page.getByRole('button', { name: 'Create task', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('This local time does not exist')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Open calendar for due date' }).click()
    await expect(page.getByRole('dialog', { name: 'Due date calendar' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Due date calendar' })).toHaveCSS('opacity', '1')
    await page.screenshot({ path: 'test-results/calendar-dark-mobile.png', fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.screenshot({ path: 'test-results/sidebar-dark-mobile.png', fullPage: true })
    await page
      .getByRole('dialog', { name: 'Sidebar', exact: true })
      .getByRole('button', { name: 'Close', exact: true })
      .click()
    expect(errors).toEqual([])
  })
})

test('appearance presets, shuffle, device mode, persistence, and mobile settings', async ({
  page,
  context,
}) => {
  const { email } = await account(page)
  const writes = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/') && request.method() !== 'GET') writes.push(request.url())
  })
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page).toHaveURL(/\/settings\/appearance$/)
  const root = page.locator('html')
  const choose = (name) => page.getByRole('radio', { name, exact: true }).locator('..').click()
  const token = (name) =>
    page.evaluate(
      (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
      name,
    )
  await expect(page.getByRole('radio', { name: 'Amber Stone', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked()
  expect(await token('--primary')).toBe('oklch(0.555 0.163 48.998)')
  expect(await token('--sidebar-primary')).toBe('oklch(0.666 0.179 58.318)')
  expect(await token('--radius')).toBe('0.45rem')
  await page.screenshot({ path: 'test-results/appearance-light-desktop.png', fullPage: true })

  await choose('Dark')
  await expect(root).toHaveClass(/dark/)
  expect(await token('--primary')).toBe('oklch(0.473 0.137 46.201)')
  expect(await token('--sidebar-primary')).toBe('oklch(0.769 0.188 70.08)')
  await expect(page.locator('body')).toHaveCSS('background-color', 'oklch(0.147 0.004 49.25)')
  await page.screenshot({ path: 'test-results/appearance-dark-desktop.png', fullPage: true })

  await choose('Forest')
  expect(await token('--primary')).toBe('oklch(0.765 0.177 163.223)')
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Forest', exact: true })).toBeChecked()
  await expect(root).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Shuffle theme' }).click()
  await expect(root).not.toHaveAttribute('data-theme', 'forest')
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()

  // Native radio groups support arrow-key selection as well as clicking the cards.
  await page.getByRole('radio', { name: 'Dark', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'System', exact: true })).toBeChecked()
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(root).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole('radio', { name: 'System', exact: true })).toBeChecked()
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(root).toHaveClass(/dark/)

  // Appearance follows browser storage across tabs without any API mutation.
  const other = await context.newPage()
  await other.goto('/login')
  await other.evaluate(() =>
    localStorage.setItem('devtrack.appearance', JSON.stringify({ preset: 'violet', mode: 'dark' })),
  )
  await expect(page.getByRole('radio', { name: 'Violet', exact: true })).toBeChecked()
  await other.close()
  await page.getByRole('link', { name: 'Companies', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  await expect(root).toHaveClass(/dark/)
  await page.getByRole('link', { name: 'New company', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Company name', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/company-form-dark-desktop.png', fullPage: true })
  await page.goto('/settings/appearance')
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  expect(writes).toEqual([])

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await choose('Amber Stone')
  await page.screenshot({ path: 'test-results/appearance-dark-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: 'Reset to default' }).click()
  await expect(root).not.toHaveClass(/dark/)
  expect(await token('--primary')).toBe('oklch(0.555 0.163 48.998)')
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Amber Stone', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked()

  await page.evaluate(() => localStorage.setItem('devtrack.appearance', 'invalid json'))
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Amber Stone', exact: true })).toBeChecked()
  await choose('Dark')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await signOut(page)
  await expect(page).toHaveURL(/\/login$/)
  await expect(root).toHaveClass(/dark/)
  await expect(page.getByRole('link', { name: 'Create an account' })).toHaveCSS(
    'color',
    'oklch(0.769 0.188 70.08)',
  )
  await page.screenshot({ path: 'test-results/login-dark-mobile.png', fullPage: true })
  await page.goto('/settings/appearance')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/settings\/appearance$/)
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()
})

test('development design preview renders without writing to the API', async ({ page }) => {
  const writes = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/') && request.method() !== 'GET') writes.push(request.url())
  })
  await page.goto('/design-preview')
  await expect(page.getByRole('heading', { name: 'A considered workspace' })).toBeVisible()
  await page.getByRole('button', { name: 'form', exact: true }).click()
  await page.getByRole('button', { name: 'Create company', exact: true }).click()
  await expect(page.getByText('Company name is required.')).toBeVisible()
  await page.getByLabel('Company name').fill('Preview Company')
  await page.getByRole('button', { name: 'Create company', exact: true }).click()
  await expect(page.getByText('Preview only — nothing was saved.')).toBeVisible()
  expect(writes).toEqual([])
})
async function account(page) {
  const email = `client-${randomUUID()}@example.com`
  const response = await page.request.post(`${api}/auth/register`, {
    data: { fullName: 'Client Tester', email, password },
  })
  expect(response.status()).toBe(201)
  const { data } = await response.json()
  await page.goto('/login')
  await page.evaluate((token) => sessionStorage.setItem('devtrack.session', token), data.token)
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  return { token: data.token, email }
}
async function create(page, token, kind, data) {
  const response = await page.request.post(`${api}/${kind}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  expect(response.status()).toBe(201)
  return (await response.json()).data
}
async function selectRecord(page, label, name) {
  const select = page.getByRole('combobox', { name: label, exact: true })
  await select.click()
  await page
    .getByRole('combobox', { name: `Search ${label.toLowerCase()}`, exact: true })
    .fill(name)
  await page.getByRole('option', { name, exact: true }).click()
}
async function selectChoice(page, label, name) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('option', { name, exact: true }).click()
}
async function selectTimezone(page, label, name) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('combobox', { name: 'Search timezones', exact: true }).fill(name)
  await page.getByRole('option', { name, exact: true }).click()
}
async function fillDateTime(page, label, value) {
  const [date, time] = value.split('T')
  await page.getByRole('textbox', { name: label, exact: true }).fill(date)
  await page
    .getByLabel(`${label} time`, { exact: true })
    .fill(time.endsWith(':00') && time.length === 8 ? time.slice(0, 5) : time)
}
async function signOut(page) {
  await page.getByRole('button', { name: 'Account menu', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
}
async function removeCurrent(page) {
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click()
}

test('authentication, expired sessions, reload verification, and account isolation', async ({
  page,
}) => {
  const email = `signup-${randomUUID()}@example.com`
  await page.goto('/companies')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Browser Tester')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  await signOut(page)
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  await page.route('**/auth/me', (route) => route.abort(), { times: 2 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
  await page.unroute('**/auth/me')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
  await page.evaluate(() => sessionStorage.setItem('devtrack.session', 'expired.invalid.token'))
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('status')).toContainText('Your session expired')
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true })
})

test('company, contact, application, and repeating task browser journey against the real API', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await account(page)
  await page.getByRole('link', { name: 'New company', exact: true }).click()
  await page.getByLabel('Company name').fill('Northstar Studio E2E')
  await page.getByLabel('Industry', { exact: true }).fill('Software')
  await page.getByLabel('Country', { exact: true }).fill('Singapore')
  await page.getByRole('button', { name: 'Create company', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Northstar Studio E2E', exact: true }),
  ).toBeVisible()
  const companyUrl = page.url()
  await page.getByRole('button', { name: 'Archive company' }).click()
  await expect(page.getByRole('button', { name: 'Reactivate company' })).toBeVisible()
  await page.getByRole('button', { name: 'Reactivate company' }).click()
  await expect(page.getByRole('button', { name: 'Archive company' })).toBeVisible()
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Industry', { exact: true }).fill('Developer tools')
  await page.route('**/api/v1/companies/*', async (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 500,
          json: { success: false, error: 'Temporary test failure', code: 'INTERNAL_ERROR' },
        })
      : route.continue(),
  )
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Temporary test failure')
  await expect(page.getByLabel('Industry', { exact: true })).toHaveValue('Developer tools')
  await page.unroute('**/api/v1/companies/*')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Northstar Studio E2E', exact: true }),
  ).toBeVisible()

  await page.goto('/contacts/new')
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Sarah Johnson E2E')
  await selectRecord(page, 'Company', 'Northstar Studio E2E')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('sarah@example.com')
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+1 234 567 8900')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('Senior Recruiter')
  await page
    .getByRole('textbox', { name: 'Photo URL', exact: true })
    .fill('https://images.unsplash.com/photo-1521791136064-7986c2920216')
  await page
    .getByRole('textbox', { name: 'LinkedIn URL', exact: true })
    .fill('https://www.linkedin.com/in/sarah-johnson')
  await selectTimezone(page, 'Date display timezone', 'Asia/Yangon')
  await fillDateTime(page, 'Last contacted', '2026-09-08T09:00')
  await fillDateTime(page, 'Next follow-up', '2026-09-10T09:00')
  await page.getByRole('button', { name: 'Create contact', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sarah Johnson E2E', exact: true })).toBeVisible()
  const contactUrl = page.url()
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+1 234 567 8999')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('+1 234 567 8999', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Update follow-up' }).click()
  await fillDateTime(page, 'Next follow-up', '2026-09-12T09:00')
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  await page.goto('/applications/new')
  await page.getByRole('textbox', { name: 'Position', exact: true }).fill('Frontend Engineer E2E')
  await selectRecord(page, 'Company', 'Northstar Studio E2E')
  await selectRecord(page, 'Recruiter', 'Sarah Johnson E2E')
  await selectTimezone(page, 'Timezone', 'UTC')
  await page.getByRole('button', { name: 'Create application', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Frontend Engineer E2E', exact: true }),
  ).toBeVisible()
  const applicationUrl = page.url()
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Salary', { exact: true }).fill('USD 90,000 / year')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('USD 90,000 / year', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Change stage' }).click()
  await selectChoice(page, 'Stage', 'Applied')
  await fillDateTime(page, 'Date applied', '2026-09-08T09:00')
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stage history' })).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(2)

  await page.goto('/tasks/new')
  await page.getByLabel('Task title').fill('Follow up with Sarah E2E')
  await selectChoice(page, 'Type', 'Follow-up')
  await selectChoice(page, 'Priority', 'High')
  await selectTimezone(page, 'Timezone', 'UTC')
  await fillDateTime(page, 'Due date', `${new Date().toISOString().slice(0, 10)}T09:00`)
  await selectChoice(page, 'Repeat', 'Daily')
  await page.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Follow up with Sarah E2E', exact: true }),
  ).toBeVisible()
  const taskUrl = page.url()
  await page.getByRole('button', { name: 'Complete task' }).click()
  await expect(page.getByRole('link', { name: 'Open next task' })).toBeVisible()
  const nextUrl = await page.getByRole('link', { name: 'Open next task' }).getAttribute('href')
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)
  await page.goto('/tasks/today?timezone=UTC')
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Follow up with Sarah E2E', exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'test-results/today-desktop.png', fullPage: true })
  await page.goto(nextUrl)
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await selectChoice(page, 'Status', 'Cancelled')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Reopen task' })).toBeVisible()
  await page.getByRole('button', { name: 'Reopen task' }).click()
  await expect(page.getByRole('button', { name: 'Complete task' })).toBeVisible()

  for (const url of [taskUrl, applicationUrl, contactUrl, companyUrl]) {
    await page.goto(url)
    await removeCurrent(page)
    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'This record is unavailable' })).toBeVisible()
  }
  await page.goto(nextUrl)
  await expect(
    page.getByRole('heading', { name: 'Follow up with Sarah E2E', exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('one-time completion, required fields, and resetting a recruiter when company changes', async ({
  page,
}) => {
  const { token } = await account(page)
  const first = await create(page, token, 'companies', { name: 'First Company' })
  await create(page, token, 'companies', { name: 'Second Company' })
  await create(page, token, 'contacts', {
    companyId: first.id,
    name: 'First Recruiter',
    photo: 'https://example.com/photo.jpg',
    email: 'recruiter@example.com',
    phone: '+1 234 567',
    linkedIn: 'https://linkedin.com/in/recruiter',
    role: 'Recruiter',
    lastContactAt: '2026-09-08T09:00:00.000Z',
    nextFollowUpAt: '2026-09-09T09:00:00.000Z',
  })
  await page.goto('/applications/new')
  await selectRecord(page, 'Company', 'First Company')
  await selectRecord(page, 'Recruiter', 'First Recruiter')
  await selectRecord(page, 'Company', 'Second Company')
  await expect(page.getByRole('combobox', { name: 'Recruiter', exact: true })).toContainText(
    'Select recruiter',
  )
  await page.getByRole('combobox', { name: 'Recruiter', exact: true }).click()
  await expect(page.getByText('No matching records.')).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'All tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Discard changes' }).click()
  await page.getByRole('link', { name: 'New task', exact: true }).click()
  await page.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(page.getByText('Task title is required.')).toBeVisible()
  await page.getByLabel('Task title').fill('One small step')
  await selectChoice(page, 'Repeat', 'Daily')
  await page.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(page.getByText('A repeating task needs a due date.')).toBeVisible()
  await selectChoice(page, 'Repeat', 'Does not repeat')
  await page.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'One small step', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Complete task' }).click()
  await expect(page.getByText('This task is now read-only.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open next task' })).toHaveCount(0)
})

test('server pagination, filter URLs, relationship selection beyond page one, and account isolation', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const { token } = await account(page)
  for (let i = 0; i < 22; i++)
    await create(page, token, 'companies', {
      name: `Studio ${String(i).padStart(2, '0')}`,
      country: i === 21 ? 'Myanmar' : 'Singapore',
    })
  await page.goto('/companies?sortBy=name&order=asc&limit=10')
  await expect(page.getByText('1–10 of 22 records')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('11–20 of 22 records')).toBeVisible()
  await page.getByRole('link', { name: 'Studio 10', exact: true }).click()
  await page.getByRole('link', { name: 'Back to companies', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByLabel('Country', { exact: true }).fill('Myanmar')
  await expect(page.getByText('1–1 of 1 records')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Studio 21', exact: true })).toBeVisible()
  await page.goto('/contacts/new')
  const company = page.getByRole('combobox', { name: 'Company', exact: true })
  await company.click()
  await expect(page.getByRole('option')).toHaveCount(21)
  await page.getByRole('button', { name: 'Next options', exact: true }).click()
  await expect(page.getByRole('option')).toHaveCount(3)
  const chosen = await page.getByRole('option').nth(1).innerText()
  await page.getByRole('option', { name: chosen, exact: true }).click()
  await expect(company).toContainText(chosen)
  await company.click()
  await page.getByRole('button', { name: 'Previous options', exact: true }).click()
  await expect(company).toContainText(chosen)
  await expect(page.getByRole('option')).toHaveCount(22)
  await page.keyboard.press('Escape')
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Unsaved draft')
  await page.getByRole('link', { name: 'Companies', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible()
  await page.getByRole('button', { name: 'Discard changes' }).click()
  const privateUrl = await page
    .getByRole('link', { name: 'Studio 21', exact: true })
    .getAttribute('href')
  await signOut(page)
  await account(page)
  await expect(page.getByText('Your companies start here')).toBeVisible()
  await page.goto(privateUrl)
  await expect(page.getByRole('heading', { name: 'This record is unavailable' })).toBeVisible()
})

test('responsive navigation and real empty, loading, and retry states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await account(page)
  await expect(page.getByText('Your companies start here')).toBeVisible()
  await page.screenshot({ path: 'test-results/companies-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible()
  await page.route('**/api/v1/tasks?**', (route) =>
    route.fulfill({ status: 503, json: { success: false, error: 'Test outage' } }),
  )
  await page.goto('/tasks')
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
  await page.unroute('**/api/v1/tasks?**')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('Your tasks start here')).toBeVisible()
  const width = await page.evaluate(() => ({
    window: innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(width.document).toBeLessThanOrEqual(width.window)
})
