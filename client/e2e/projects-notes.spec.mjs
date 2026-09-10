import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
const api = 'http://127.0.0.1:4010/api/v1'
async function account(page) {
  const response = await page.request.post(`${api}/auth/register`, {
    data: {
      fullName: 'Portfolio Tester',
      email: `portfolio-${randomUUID()}@example.com`,
      password: 'ClientTest2026!',
    },
  })
  expect(response.status()).toBe(201)
  const { data } = await response.json()
  await page.goto('/login')
  await page.evaluate((token) => sessionStorage.setItem('devtrack.session', token), data.token)
  await page.goto('/projects')
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  return data.token
}
async function send(page, token, method, path, data) {
  const response = await page.request[method](`${api}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    ...(data === undefined ? {} : { data }),
  })
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBe(true)
  return response.json()
}
async function choice(page, label, name) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('option', { name, exact: true }).click()
}
async function pick(page, name, label = 'Linked record') {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page
    .getByRole('combobox', { name: `Search ${label.toLowerCase()}`, exact: true })
    .fill(name)
  await page.getByRole('option', { name, exact: true }).click()
}
async function save(page, label, suffix, method) {
  const pending = page.waitForResponse(
    (response) => response.url().endsWith(suffix) && response.request().method() === method,
  )
  await page.getByRole('button', { name: label, exact: true }).click()
  const response = await pending
  expect(response.ok(), await response.text()).toBe(true)
  if (['Create project', 'Create note', 'Save changes'].includes(label)) {
    await expect(
      page.getByRole('heading', {
        name: /^(New project|New note|Edit project|Edit note)$/,
        exact: true,
      }),
    ).toHaveCount(0)
  }
  if (label === 'Save progress') await expect(page.getByRole('dialog')).not.toBeVisible()
  return { body: response.request().postDataJSON(), ...(await response.json()) }
}
async function remove(page) {
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click()
}
async function edit(page) {
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
}

test('Projects create/edit, state validation, activity/comment pagination, archive/reopen, retry and deletion', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const token = await account(page),
    errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://example.com/project.png', (route) => route.abort())
  await page.getByRole('link', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name').fill('BINGO portfolio')
  await page.getByLabel('Initial progress (%)').fill('40')
  await page.getByRole('button', { name: 'Create project', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Planned: 0%')
  await choice(page, 'Initial status', 'In progress')
  await page.getByLabel('GitHub URL').fill('https://github.com/example/bingo')
  await page.getByLabel('Technology stack').fill(' React \nTypeScript\nreact')
  await page.getByLabel('Screenshot URLs').fill('https://example.com/project.png')
  await page.getByLabel('Lessons learned').fill('  Preserve this indentation\nNext step')
  const { data: project } = await save(page, 'Create project', '/projects', 'POST')
  expect(project).toMatchObject({
    status: 'IN_PROGRESS',
    progress: 40,
    stack: ['react', 'typescript'],
  })
  await expect(page.getByRole('heading', { name: project.name, exact: true })).toBeVisible()
  await expect(page.getByText('Image unavailable', { exact: true })).toBeVisible()
  await edit(page)
  await expect(page.getByLabel('Initial status')).toHaveCount(0)
  await page.getByLabel('Project name').fill('BINGO portfolio updated')
  const path = `**/api/v1/projects/${project.id}`
  const failPut = (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 503,
          json: { success: false, error: 'Temporary save failure', code: 'TEST_FAILURE' },
        })
      : route.continue()
  await page.route(path, failPut)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Temporary save failure')
  await expect(page.getByLabel('Project name')).toHaveValue('BINGO portfolio updated')
  await page.unroute(path, failPut)
  await page.getByLabel('GitHub URL').fill('')
  await page.getByLabel('Screenshot URLs').fill('')
  const updated = await save(page, 'Save changes', `/projects/${project.id}`, 'PUT')
  expect(updated.body).not.toHaveProperty('status')
  expect(updated.body).not.toHaveProperty('progress')
  expect(updated.body).toMatchObject({ githubUrl: null, screenshots: [] })
  await page.getByRole('button', { name: 'Update progress', exact: true }).click()
  await choice(page, 'Status', 'Completed')
  await page.getByRole('button', { name: 'Save progress' }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Completed: 100%')
  await page.getByLabel('Progress (%)', { exact: true }).fill('100')
  await page.getByLabel('Message (optional)').fill('Core implementation complete')
  await save(page, 'Save progress', `/projects/${project.id}/progress`, 'PATCH')
  await expect(
    page.getByRole('progressbar', { name: 'Project progress', exact: true }),
  ).toHaveAttribute('value', '100')
  for (const [status, progress] of [
    ['Archived', '100'],
    ['In progress', '75'],
    ['On hold', '75'],
  ]) {
    await page.getByRole('button', { name: 'Update progress', exact: true }).click()
    await choice(page, 'Status', status)
    await page.getByLabel('Progress (%)', { exact: true }).fill(progress)
    await save(page, 'Save progress', `/projects/${project.id}/progress`, 'PATCH')
  }
  const before = await send(page, token, 'get', `projects/${project.id}/activities`)
  await page.getByRole('button', { name: 'Update progress', exact: true }).click()
  await page.getByLabel('Message (optional)').fill('Message without a state change')
  await page.getByRole('button', { name: 'Save progress' }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('unchanged')
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()
  expect((await send(page, token, 'get', `projects/${project.id}/activities`)).meta.total).toBe(
    before.meta.total,
  )
  for (let n = 0; n < 8; n++)
    await send(page, token, 'post', `projects/${project.id}/activities`, {
      content: `Seed comment ${n}`,
    })
  await page.reload()
  await page.getByLabel('Add a comment').fill('Reviewed the portfolio together')
  await save(page, 'Add comment', `/projects/${project.id}/activities`, 'POST')
  await expect(
    page
      .getByRole('region', { name: 'Project activity' })
      .getByRole('listitem')
      .filter({ hasText: 'Reviewed the portfolio together' }),
  ).toBeVisible()
  await expect(page.getByRole('region', { name: 'Project activity' })).toContainText('Page 2 of 2')
  await page.screenshot({ path: 'test-results/projects-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await choice(page, 'Status', 'On hold')
  await page.getByLabel('Stack (exact entry)').fill('React')
  await page.getByLabel('Search projects').fill('BINGO')
  await expect(page.getByRole('link', { name: updated.data.name, exact: true })).toBeVisible()
  const returnUrl = page.url()
  await page.getByRole('link', { name: updated.data.name, exact: true }).click()
  await edit(page)
  await page.getByLabel('Lessons learned').fill('A later lesson')
  await save(page, 'Save changes', `/projects/${project.id}`, 'PUT')
  await page.getByRole('link', { name: 'Back to projects', exact: true }).click()
  await expect(page).toHaveURL(returnUrl)
  await page.getByRole('link', { name: updated.data.name, exact: true }).click()
  await remove(page)
  await expect(page).toHaveURL(returnUrl)
  await expect(page.getByText('No matching records', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Notes format text, guard drafts, retry saves, filter tags and keep existing content on title edits', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const token = await account(page)
  const imageRequests = [],
    errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('markdown-image.example')) imageRequests.push(request.url())
  })
  await page.getByRole('link', { name: 'Notes', exact: true }).click()
  await page.getByRole('link', { name: 'New note', exact: true }).click()
  await page.getByLabel('Note title').fill('Interview notebook')
  const content = 'Review indexes'
  const editor = page.getByRole('textbox', { name: 'Content', exact: true })
  await page.getByRole('button', { name: 'Create note', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Write some content')
  await editor.fill(content)
  await editor.press('ControlOrMeta+a')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await page.getByRole('button', { name: 'Italic', exact: true }).click()
  await expect(editor.locator('strong em, em strong')).toHaveText(content)
  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Link', exact: true }).click()
  await page.getByLabel('Link URL').fill('javascript:alert(1)')
  await page.getByRole('button', { name: 'Apply link', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Enter an https://')
  await page.getByLabel('Link URL').fill('https://example.com/indexes')
  await page.getByRole('button', { name: 'Apply link', exact: true }).click()
  await expect(editor.locator('a')).toHaveAttribute('href', 'https://example.com/indexes')
  await page.getByLabel('Tags', { exact: true }).fill(' Interview \nbackend\nINTERVIEW')
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await expect(editor.locator('strong em, em strong')).toHaveText(content)
  const failPost = (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 503,
          json: { success: false, error: 'Try saving again', code: 'TEST_FAILURE' },
        })
      : route.continue()
  await page.route('**/api/v1/notes', failPost)
  await page.getByRole('button', { name: 'Create note', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Try saving again')
  await expect(editor.locator('strong em, em strong')).toHaveText(content)
  await page.unroute('**/api/v1/notes', failPost)
  const { data: note } = await save(page, 'Create note', '/notes', 'POST')
  expect(note.content).toContain('Review indexes')
  expect(note.tags).toEqual(['interview', 'backend'])
  expect(note.entity).toBeNull()
  await expect(
    page.locator(
      '[aria-label="Formatted note"] strong em, [aria-label="Formatted note"] em strong',
    ),
  ).toHaveText(content)
  await page.screenshot({ path: 'test-results/notes-desktop.png', fullPage: true })
  await edit(page)
  await expect(editor.locator('strong em, em strong')).toHaveText(content)
  // A content-only change must also be protected when navigating away.
  await editor.press('ControlOrMeta+End')
  await editor.press('Enter')
  await editor.pressSequentially('Extra context')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(editor).not.toContainText('Extra context')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(editor).toContainText('Extra context')
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  const crlf =
    '# Interview prep\r\n\r\n- [x] Review indexes\r\n\r\n```ts\r\n  const ready = true\r\n```\r\n\r\n| Topic | Ready |\r\n| --- | --- |\r\n| SQL | Yes |\r\n\r\n<script>window.notesUnsafe = true</script>\r\n\r\n[Bad](javascript:alert%281%29)\r\n\r\n![Diagram](https://markdown-image.example/pixel.png)\r\n'
  await send(page, token, 'put', `notes/${note.id}`, { content: crlf })
  await page.goto(`/notes/${note.id}/edit`)
  await expect(editor.getByRole('heading', { name: 'Interview prep' })).toBeVisible()
  await expect(editor.getByRole('table')).toBeVisible()
  await expect(editor.locator('pre code')).toHaveText('  const ready = true')
  await expect(editor.locator('script, img[src], iframe, [onerror]')).toHaveCount(0)
  expect(await page.evaluate(() => window.notesUnsafe)).toBeUndefined()
  await page.getByLabel('Note title').fill('Interview notebook revised')
  const updated = await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  expect(updated.body).toEqual({ title: 'Interview notebook revised' })
  expect(updated.data.content).toBe(crlf)
  await page.getByRole('link', { name: 'Notes', exact: true }).click()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByLabel('Tag (exact match)').fill('INTERVIEW')
  await page.getByLabel('Search notes').fill('indexes')
  await expect(page.getByRole('link', { name: updated.data.title, exact: true })).toBeVisible()
  const listUrl = page.url()
  await page.getByRole('link', { name: updated.data.title, exact: true }).click()
  await edit(page)
  await page.getByLabel('Tags', { exact: true }).fill('')
  const cleared = await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  expect(cleared.body).toEqual({ tags: [] })
  expect(cleared.data.tags).toEqual([])
  await remove(page)
  await expect(page).toHaveURL(listUrl)
  await expect(page.getByText('No matching records', { exact: true })).toBeVisible()
  expect(imageRequests).toEqual([])
  expect(errors).toEqual([])
})

test('Notes link all five record types, appear on detail pages, retain unavailable links, detach, and recover from a deleted selection', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const token = await account(page)
  const company = (await send(page, token, 'post', 'companies', { name: 'Linked company' })).data
  const contact = (
    await send(page, token, 'post', 'contacts', {
      companyId: company.id,
      name: 'Linked contact',
      photo: 'https://example.com/photo.png',
      email: 'contact@example.com',
      phone: '+1 234 567 8900',
      linkedIn: 'https://linkedin.com/in/sample',
      role: 'Recruiter',
      lastContactAt: '2026-09-08T09:00:00Z',
      nextFollowUpAt: '2026-09-09T09:00:00Z',
    })
  ).data
  const application = (
    await send(page, token, 'post', 'applications', {
      companyId: company.id,
      position: 'Linked application',
      stage: 'WISHLIST',
    })
  ).data
  const task = (await send(page, token, 'post', 'tasks', { title: 'Linked task' })).data
  const project = (await send(page, token, 'post', 'projects', { name: 'Linked project' })).data
  await page.goto(`/projects/${project.id}`)
  await page.getByRole('link', { name: 'New note', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Link to', exact: true })).toHaveText('Project')
  await expect(page.getByRole('combobox', { name: 'Linked record', exact: true })).toContainText(
    project.name,
  )
  await page.getByLabel('Note title').fill('Linked decisions')
  await page
    .getByRole('textbox', { name: 'Content', exact: true })
    .fill('Keep these records connected.')
  const { data: note } = await save(page, 'Create note', '/notes', 'POST')
  expect(note.entity).toEqual({ type: 'PROJECT', id: project.id })
  const bindings = [
    ['Company', 'companies', company],
    ['Contact', 'contacts', contact],
    ['Application', 'applications', application],
    ['Task', 'tasks', task],
    ['Project', 'projects', project],
  ]
  for (const [type, kind, record] of bindings) {
    await page.goto(`/notes/${note.id}/edit`)
    await choice(page, 'Link to', type)
    await expect(page.getByRole('combobox', { name: 'Linked record', exact: true })).toContainText(
      'Select linked record',
    )
    await pick(page, record.name || record.title || record.position)
    const linked = await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
    expect(linked.data.entity).toEqual({ type: type.toUpperCase(), id: record.id })
    await page.goto(`/${kind}/${record.id}`)
    await expect(
      page
        .getByRole('region', { name: 'Related notes' })
        .getByRole('link', { name: note.title, exact: true }),
    ).toBeVisible()
  }
  await remove(page)
  await page.goto(`/notes/${note.id}`)
  await expect(page.getByText('Linked record unavailable.', { exact: false })).toBeVisible()
  await edit(page)
  await page.getByLabel('Note title').fill('Retained after deletion')
  const retained = await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  expect(retained.body).toEqual({ title: 'Retained after deletion' })
  expect(retained.data.entityAvailable).toBe(false)
  await edit(page)
  await choice(page, 'Link to', 'Standalone note')
  const detached = await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  expect(detached.body).toEqual({ entity: null })
  expect(detached.data.entityAvailable).toBeNull()
  const doomed = (await send(page, token, 'post', 'projects', { name: 'Deleted during edit' })).data
  await edit(page)
  await choice(page, 'Link to', 'Project')
  await pick(page, doomed.name)
  await page
    .getByRole('textbox', { name: 'Content', exact: true })
    .fill('Draft preserved through failed rebind')
  await send(page, token, 'delete', `projects/${doomed.id}`)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Content', exact: true })).toHaveText(
    'Draft preserved through failed rebind',
  )
  expect((await send(page, token, 'get', `notes/${note.id}`)).data.entity).toBeNull()
  await choice(page, 'Link to', 'Standalone note')
  await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  await expect(
    page.getByText('Draft preserved through failed rebind', { exact: true }),
  ).toBeVisible()
})

test('Projects and Notes paginate with server filters, recover the last page, and enforce account/session boundaries', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const token = await account(page)
  let project, note
  for (let i = 0; i < 21; i++) {
    project = (
      await send(page, token, 'post', 'projects', {
        name: `Portfolio ${String(i).padStart(2, '0')}`,
        stack: ['react'],
      })
    ).data
    note = (
      await send(page, token, 'post', 'notes', {
        title: `Research ${String(i).padStart(2, '0')}`,
        content: 'Filter this content',
        tags: ['research'],
        entity: { type: 'PROJECT', id: project.id },
      })
    ).data
  }
  await page.goto('/projects?limit=10&sortBy=name&order=asc&stack=react')
  await expect(page.getByText('1–10 of 21 records')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('11–20 of 21 records')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('21–21 of 21 records')).toBeVisible()
  await page.getByRole('link', { name: project.name, exact: true }).click()
  await remove(page)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('11–20 of 20 records')).toBeVisible()
  await page.goto('/notes?limit=10&sortBy=title&order=asc&tag=research')
  await expect(page.getByText('1–10 of 21 records')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('11–20 of 21 records')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('21–21 of 21 records')).toBeVisible()
  await page.getByRole('link', { name: note.title, exact: true }).click()
  await expect(page.getByText('Linked record unavailable.', { exact: false })).toBeVisible()
  await remove(page)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('11–20 of 20 records')).toBeVisible()
  // An incomplete filter URL must not produce a backend 400.
  await page.goto('/notes?entityType=PROJECT')
  await expect(
    page.getByText('The entity filter needs a valid record type and record.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await pick(page, 'Portfolio 00', 'Linked record filter')
  await expect(page).toHaveURL(/entityId=/)
  await expect(page.getByText('1–1 of 1 records')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Research 00', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Account menu', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await account(page)
  await expect(page.getByText('Your projects start here', { exact: true })).toBeVisible()
  await page.goto('/notes')
  await expect(page.getByText('Your notes start here', { exact: true })).toBeVisible()
  const foreign = (await send(page, token, 'get', 'notes')).data[0]
  await page.goto(`/notes/${foreign.id}`)
  await expect(page.getByRole('heading', { name: 'This record is unavailable' })).toBeVisible()
  await page.goto(`/projects/${foreign.entity.id}`)
  await expect(page.getByRole('heading', { name: 'This record is unavailable' })).toBeVisible()
  await page.evaluate(() => sessionStorage.setItem('devtrack.session', 'invalid-test-token'))
  await page.goto('/notes/new')
  await expect(page).toHaveURL(/\/login$/)
})

test('New record pickers paginate and the Notes editor works on mobile in the existing dark theme', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const token = await account(page),
    projects = []
  for (let i = 0; i < 22; i++)
    projects.push(
      (await send(page, token, 'post', 'projects', { name: `Picker project ${i}` })).data,
    )
  await page.goto('/notes/new')
  await page.getByLabel('Note title').fill('Mobile note')
  await page
    .getByRole('textbox', { name: 'Content', exact: true })
    .fill('Mobile review. Clear controls for small screens. Long content stays inside the page.')
  await choice(page, 'Link to', 'Project')
  await page.getByRole('combobox', { name: 'Linked record', exact: true }).click()
  await page.getByRole('button', { name: 'Next options' }).click()
  const option = page.getByRole('option').filter({ hasText: 'Picker project' }).last()
  const selectedName = await option.textContent()
  await option.click()
  await expect(page.getByRole('combobox', { name: 'Linked record', exact: true })).toContainText(
    selectedName,
  )
  const { data: note } = await save(page, 'Create note', '/notes', 'POST')
  expect(projects.find((project) => project.id === note.entity.id).name).toBe(selectedName)
  await page.goto('/settings/appearance')
  await page.getByRole('radio', { name: 'Dark', exact: true }).locator('..').click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const sidebar = page.getByRole('dialog', { name: 'Sidebar', exact: true })
  await expect(sidebar).toBeVisible()
  await sidebar.getByRole('link', { name: 'Notes', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Sidebar', exact: true })).not.toBeVisible()
  await page.getByRole('link', { name: note.title, exact: true }).click()
  await expect(page.getByRole('heading', { name: note.title, exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/notes-dark-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await edit(page)
  await page.getByLabel('Note title').fill('Mobile edit')
  await page.getByRole('textbox', { name: 'Content', exact: true }).press('ControlOrMeta+a')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Content', exact: true }).locator('strong'),
  ).toBeVisible()
  await page.screenshot({ path: 'test-results/notes-editor-dark-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await save(page, 'Save changes', `/notes/${note.id}`, 'PUT')
  await expect(page.getByRole('heading', { name: 'Mobile edit', exact: true })).toBeVisible()
})
