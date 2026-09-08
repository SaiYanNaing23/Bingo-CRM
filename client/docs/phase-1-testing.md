# Client Phase 1 - Authentication and shell

Start both apps. Create a unique test account or use an existing account. Values below are examples, not pre-created credentials.

1. Open `/companies` while signed out. Expect redirect to Sign in.
2. Choose Create an account. Fill full name, email, and password, then submit. Expect the Companies workspace.
3. Reload. Expect the same account after `/auth/me` verification.
4. Navigate between Companies, Contacts, Applications, All tasks, and Today. On mobile, open the navigation menu and select a module.
5. Open the account menu at the bottom of the sidebar and choose Sign out. Attempt login with an incorrect password; expect the error beside the form. Correct it and sign in again.
6. To test expiry, wait for the configured token lifetime (default 15 minutes), then make an API request. Expect a session-expired message and sign-in screen.
7. While signed out, create a second account and check that it does not show the first account's records.

Register:

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "fullName": "Frontend Tester",
  "email": "frontend.tester@example.com",
  "password": "ExampleTest2026!"
}
```

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "frontend.tester@example.com",
  "password": "ExampleTest2026!"
}
```

Register returns 201; login returns 200. Both return `data.token` and `data.user`. For later API requests use `Authorization: Bearer <TOKEN>`.

```http
GET /api/v1/auth/me
Authorization: Bearer <TOKEN>
```

Expect 200 with `data.user` containing `id`, `email`, and `role`. There is no refresh/logout API: frontend logout removes the tab session. When session verification fails because the network is unavailable, the client offers retry instead of treating it as incorrect credentials.

Manual checks:

- [ ] Register/login and incorrect-password feedback.
- [ ] Reload restores a verified session.
- [ ] Expiry and sign-out return to sign-in.
- [ ] Account switching does not retain another account's records.
- [ ] Desktop/mobile navigation works.
