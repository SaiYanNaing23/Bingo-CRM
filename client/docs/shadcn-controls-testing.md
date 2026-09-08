# shadcn dropdowns, date/time picker, and sidebar

Start both apps using [the runbook](../README.md), sign in, and use dedicated test records. The existing API contracts and sample payloads in the phase guides are unchanged.

## Dropdowns and search

1. Open New task. Type, Priority, Status, and Repeat should open styled shadcn Select menus. Use arrow keys and Enter as well as pointer selection. Escape should close the menu and return focus to its trigger.
2. Open Contacts → New contact. Click Company, search by name inside the popup, and select a record. With more than 20 records, use Next options, choose one, reopen the popup, and use Previous options. The selected company should still appear with a checkmark.
3. Open New application. Select a company and one of its recruiters. Change the company: Recruiter must clear, and its options must belong to the new company. Clear selection removes an optional relationship; a required Company still validates on submit.
4. Open any timezone combobox and search for `Asia/Yangon`, `UTC`, or `America/New_York`. Choose a result. These are named zones, with conversion and daylight-saving validation handled by the existing date helpers.
5. In a list, test Sort by, Rows per page, and any enum filter. Verify the URL and API-backed results change. Selecting All removes that enum filter.

## Calendar and time

1. In New task, choose timezone `Asia/Yangon`. Click the calendar icon beside Due date. Use the month/year Select menus and choose **February 28, 2027**.
2. Enter time **10:15:37**. Save the task with a test title and Repeat Does not repeat. Expected API timestamp: `2027-02-28T03:45:37.000Z`, even when the browser's timezone is different.
3. Edit only the title and save. The existing timestamp must remain unchanged, including milliseconds supplied by the API.
4. You can also type the date as `YYYY-MM-DD`. Invalid dates such as `2026-02-30` should show a validation error on submit, not roll into another month.
5. Choose `America/New_York`, date `2026-03-08`, and time `02:30`. Submit: expect a message that this local time does not exist. Choose `03:30` to use a valid time.
6. Clear an optional Due date using its clear button and save. The API should receive `dueDate: null`. A repeating task still requires a due date. Required contact dates cannot be left empty.
7. Test the same calendar/time controls inside Update follow-up and Change stage dialogs. Escape should dismiss the calendar first and return focus to its trigger.
8. In Tasks filters, set Due from or Due to, then choose the corresponding Apply button. Date filters use the displayed browser timezone. Clearing the field and applying removes that filter.

The separate time field is a shadcn Input with `type="time"` and second precision, matching the documented Calendar/Popover + time-input pattern. A newly entered date starts at 09:00; changing a date preserves an already entered time. Entering only a time never silently selects today's date.

## Sidebar

1. Use the header toggle to collapse to icons. Hover icons to see tooltips; every module and the account menu must remain clickable. Reload: the collapsed state should remain.
2. Use Ctrl+B on Windows or Cmd+B on macOS outside an input to toggle the sidebar. Typing shortcuts in text/date/search fields must not collapse it.
3. Open the account menu → Appearance. Theme settings must still work. Sign out is in the same menu.
4. At phone width, use Open navigation. Select a module, close with the close button, or use Escape. There should be no page-level horizontal overflow from the sidebar, dropdowns, or calendar.

## Manual results

- [ ] Select menus and searchable relationship/timezone popups work with keyboard and pointer.
- [ ] Calendar selection and second-precision time round-trip in the selected timezone.
- [ ] Invalid dates, daylight-saving gaps, required dates, and clearing optional dates behave correctly.
- [ ] Dialog and list-filter date controls work.
- [ ] Collapsed icons, tooltips, account menu, reload persistence, and mobile sidebar work.
- [ ] Current light/dark palettes style all new controls consistently.
