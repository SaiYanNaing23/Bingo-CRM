# Client Phase 0 - Setup and design

Prerequisites: start the backend and client using [the runbook](../README.md). The default API base is `http://localhost:4000/api/v1`.

1. Open `/design-preview` in development. Its banner must say that this is sample data and nothing is saved.
2. Switch between list, detail, form, loading, and empty views. Check the default Amber Stone accent (or the palette selected in Settings), quiet borders, readable labels, and comfortable spacing.
3. In Form, submit with no company name. Expect an inline required-field message. Enter `Paperplane Labs`, submit, and expect a preview notification with no API write.
4. Use Tab and Shift+Tab to move between fields and buttons. Focus must remain visible.
5. Resize to a narrow phone width. Forms must stack and content should remain readable.
6. Open `/login`, then an unknown route. Expect a usable sign-in or missing-page state, without a blank screen.
7. Check `/login` and `/register` on desktop and mobile: the supplied blue logo and **BINGO CRM** name should appear, and the browser title should match the page. After signing in, check the logo in the expanded, collapsed, and mobile sidebar. In light and dark modes the logo should remain blue on white; the selected UI palette should stay unchanged. The browser tab should use the supplied logo as its icon.

Health request (no body, no authentication):

```http
GET http://localhost:4000/api/v1/health
```

Expected: HTTP 200 with `success: true` and healthy status data. A health response does not replace exercising database-backed module endpoints.

Manual checks:

- [ ] Local client/API start successfully.
- [ ] Design preview matches the selected style.
- [ ] Keyboard and mobile layouts are usable.
- [ ] Required validation and preview-only feedback work.
- [ ] BINGO CRM branding, browser icon/title, and logo display correctly across screen sizes and themes.

These checkboxes are reserved for the user's manual results.
