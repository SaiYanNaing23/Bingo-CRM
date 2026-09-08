# BINGO CRM client

React + TypeScript + Vite, shadcn/ui and Tailwind, React Router, TanStack Query/Table, React Hook Form and Zod. Implements client Phases 0-5 against the existing Express API: authentication, Companies, Contacts, Applications, Tasks and Today. Also includes Settings → Appearance (client 6.6).

Branding uses the supplied [BINGO CRM logo](public/branding/bingo-crm-logo.png) in the sidebar, authentication screens, and browser icon. The original PNG is kept intact, with a white backing in both color modes. Replace that asset to change the logo later. Existing `devtrack` storage keys are retained so saved sessions and appearance preferences continue working.

## Run locally

The dependencies are installed for this workspace. On a fresh checkout, run `npm.cmd ci` in `client/` first.

Terminal 1, from the repository root:

```powershell
cd server
npm.cmd run dev
```

Terminal 2, from the repository root:

```powershell
cd client
npm.cmd run dev
```

Open the URL Vite prints (normally `http://127.0.0.1:5173`). Use your existing backend account, or create one through the registration screen. Both processes must stay running.

The client defaults to `http://localhost:4000/api/v1`. To override it, copy `.env.example` to `.env` and edit `VITE_API_BASE_URL`, then restart Vite. If the backend uses a specific `CORS_ORIGIN`, set it to the actual browser origin, including scheme and port. For example, `http://127.0.0.1:5173` and `http://localhost:5173` are different origins.

The backend database migrations through Tasks must already be applied. Backend setup is documented in [server README](../server/src/README.md).

## Verify

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Browser checks require installed backend dependencies, a current backend build, and `server/.env` with a working database URL:

```powershell
npm.cmd run test:e2e
```

The browser suite starts its own client on port 5175 and API on port 4010. It uses headless Microsoft Edge by default. Set `PW_CHANNEL=chrome` to use installed Chrome instead. These ports must be free.

The suite reuses the backend's test helper to create a unique PostgreSQL schema, replay migrations, and run real API requests. It removes the schema during teardown. Existing CRM records are not test fixtures. PostgreSQL permissions must allow temporary schema creation; Neon testing uses the direct endpoint to support the schema search path.

For a local production build preview, run `npm.cmd run preview` after building. On a production host, serve `dist/` with SPA fallback to `index.html` for client routes, while preserving `/api` handling if the API shares the origin. Set the public API URL before building; never place database credentials in client environment variables.

## Structure and behavior

- `src/app`: route composition, auth guards, responsive workspace shell, development-only design preview.
- `src/features/<domain>`: domain types, field/filter configuration, and page entrypoints. Applications and Tasks own their history/Today screens.
- `src/components/ui`: official shadcn component source, with local import paths and shared theme tokens.
- `src/components/shared`: the repeated list/detail/editor pattern, relationship pickers, domain actions, and page states.
- `src/lib`: typed transport/response contracts, resource query hooks, form validation/payload mapping, date conversion, and session management.
- `src/features/settings`: appearance context, validated browser preferences, preset metadata, and the Settings page.
- `src/styles`: the user's exact Amber Stone light/dark theme in `globals.css`, plus alternate accent palettes in `theme-presets.css`.

Forms and filters use shadcn Select for fixed options and Popover/Command comboboxes for companies, recruiters, and timezones. Relationship search and pagination use the API; selected records remain visible across option pages. Date/time fields combine shadcn Calendar/Popover with a date text input (`YYYY-MM-DD`) and a separate shadcn time Input, including seconds. Calendar month/year selectors also use shadcn Select. Date filters have an explicit Apply button so incomplete typing does not change the list query.

The workspace uses the official shadcn Sidebar in its inset layout: desktop icon collapse, tooltips, a mobile sheet, and an account Dropdown Menu for Appearance and Sign out. Use the header toggle or Ctrl/Cmd+B outside text fields. Desktop collapse is remembered in the `sidebar_state` browser cookie for seven days, independently of appearance settings. The workspace shell loads after authentication to keep sidebar dependencies off the initial sign-in bundle.

Search/filter/sort/page state lives in the URL. Lists use server pagination. Relationship queries run concurrently, deduplicate by record ID, and share cached details across screens. Short-lived JWTs are stored in memory and tab-scoped session storage; expired sessions return to sign-in. CRM data is not persisted in browser storage. A reload verifies the session with `/auth/me`; signing out cancels requests and clears the account cache.

Form inputs use the chosen named timezone. Nonexistent daylight-saving times are rejected. Ambiguous fall-back times follow date-fns-tz's offset selection; unchanged existing timestamps preserve their exact original instant, including milliseconds. Task recurrence is calculated by the backend.

The visual preview is at `/design-preview` in development. It contains labeled sample data and cannot create backend records. Overview, timezone/sidebar preferences, and later roadmap phases remain planned.

## Appearance

Open **Settings → Appearance** (`/settings/appearance`). The supplied Amber Stone palette in light mode is the default. Choose Light, Dark, or System; pick one of six palettes or use **Shuffle theme** to select a different one. **Reset to default** restores Amber Stone + Light. Changes apply immediately across all screens, including sign-in and the mobile sidebar.

Only appearance preferences are stored in `localStorage` under `devtrack.appearance`. They apply to this browser origin, synchronize other tabs, and survive sign-out. No backend preference endpoint or account synchronization is used. When browser storage is blocked, changes still apply to the current tab and Settings explains that they cannot be saved. System mode follows live device changes. An early script in `index.html` restores the saved theme before the app loads.

To change the default design later, edit the `:root` and `.dark` tokens in `src/styles/globals.css`. To add an alternate palette, add its selectors in `src/styles/theme-presets.css` and its name/swatch in `src/features/settings/appearance.ts`. Components use semantic tokens, so they do not need individual color edits. The alternate palettes currently change the primary/sidebar accents and focus rings, retaining the supplied neutral surfaces, radius, and chart tokens.

The additional `--link-foreground` token uses the primary color in light mode and the brighter sidebar primary in dark mode, keeping small links readable without changing the supplied palette values.

## Testing guides

- [Phase 0 - Setup and design](docs/phase-0-testing.md)
- [Phase 1 - Authentication](docs/phase-1-testing.md)
- [Phase 2 - Companies](docs/phase-2-testing.md)
- [Phase 3 - Contacts](docs/phase-3-testing.md)
- [Phase 4 - Applications](docs/phase-4-testing.md)
- [Phase 5 - Tasks and Today](docs/phase-5-testing.md)
- [Appearance settings (6.6)](docs/appearance-testing.md)
- [shadcn dropdowns, date/time picker, and sidebar](docs/shadcn-controls-testing.md)

Roadmap and completion status: [client agenda](../client-agenda.md).

## Component provenance

The shadcn registry timed out during setup, so the selected components were downloaded from the official [shadcn GitHub source](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui). Imports were adapted to `@/lib/utils` and `@/components/ui`. The upstream [MIT license](src/components/ui/LICENSE.md) is retained. `components.json` supports subsequent component additions through the official CLI.

The controls update adds official Select, Calendar, Popover, Command, Checkbox, Dropdown Menu, Tooltip, Sidebar, and `use-mobile` sources from the same registry. Calendar uses React DayPicker 9; searchable pickers use cmdk. Local adaptations preserve accessible caption/icon interactions, allow closing the mobile sidebar, and keep collapse usable when storage is blocked. The date/time composition follows the [shadcn example](https://ui.shadcn.com/docs/components/base/date-picker#time-picker), using Radix primitives to match this client's existing shadcn foundation.

TanStack Table uses the stable v8 API in this implementation. Actual installed versions are recorded in `package-lock.json`; follow matching-major documentation when updating components.
