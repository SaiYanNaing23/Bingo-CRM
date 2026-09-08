# Appearance settings (client 6.6)

Prerequisites: start the backend and client using [the runbook](../README.md), sign in, then choose **Settings** in the sidebar. On mobile, open the navigation menu first. Direct route: `/settings/appearance`; `/settings` redirects here.

This feature changes browser preferences. There is no API request payload or new backend endpoint; your existing CRM endpoints continue working as before.

## Try it

1. In a browser with no saved preference, expect **Amber Stone** and **Light** selected. This palette uses the exact light and dark CSS variables supplied by the user, with a `0.45rem` base radius.
2. Choose **Dark**. Check the page background, sidebar, cards, text, fields, borders, and status badges. Go to Companies, Contacts, Applications, and Tasks; the appearance should follow you.
3. Return to Settings and choose **Forest**. The main actions, sidebar accent, and focus rings change while the neutral surfaces remain consistent. Try Slate, Blue, Violet, and Rose too.
4. Select **Shuffle theme** several times. Each click must select a different palette, preserve the current color mode, and immediately update the whole workspace and preview.
5. Reload the page. Your palette and mode must remain selected. Open another tab on the same client URL and change the theme in one tab; the other tab should follow. Signing out also keeps the chosen appearance.
6. Select **System**, then change the device/browser preferred color scheme. The client should follow without reloading. Choosing Light or Dark explicitly should ignore later system changes.
7. Select **Reset to default**. Expect Amber Stone + Light, even if your device prefers dark. Reload to verify the reset was saved.
8. Use Tab to reach each radio group, arrow keys to change its selection, and Space/Enter on the shuffle/reset buttons. Focus should be visible. At phone width, controls should fit without page-level horizontal scrolling and Settings should remain accessible through the menu.
9. Try the preview note input. It is temporary sample content. The **View tasks** and **Companies** buttons navigate to your real module pages.

## Browser storage checks

DevTools → Application → Local Storage should show `devtrack.appearance` with a value such as:

```json
{
  "preset": "forest",
  "mode": "dark"
}
```

This JSON is stored locally, **not sent to the API**. Supported preset IDs are `amber`, `slate`, `blue`, `forest`, `violet`, and `rose`; supported modes are `light`, `dark`, and `system`. `amber` is the supplied default theme. Preferences are specific to the browser origin, so `localhost` and `127.0.0.1` keep separate choices.

For recovery testing, replace only this key's value with invalid JSON and reload. Expect the default appearance and a working app. An unsupported preset falls back to Amber Stone while a valid mode is retained. Do not clear unrelated application storage.

If browser privacy settings block storage, appearance changes should still work during the current page session. Settings will explain that the choice cannot survive a reload. Automated tests also exercise this condition.

## Manual results

- [ ] Supplied default looks right in Light and Dark.
- [ ] Every palette and shuffle work across the modules.
- [ ] Reload, other tabs, and sign-out preserve the expected appearance.
- [ ] System mode tracks device changes; reset restores Amber Stone + Light.
- [ ] Keyboard controls, mobile navigation, and fields remain usable.
- [ ] Invalid preferences recover without breaking the application.

These checkboxes are reserved for the user's results. Automated verification is recorded in the [client agenda](../../client-agenda.md).
