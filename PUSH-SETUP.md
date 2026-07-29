# Push Notifications — Setup Guide

End-to-end wiring for delivering FCM push to Android devices (and later iOS)
when the app is backgrounded or the phone is locked. Web push is deliberately
left out for now (would need a service-worker path).

**Architecture (all pieces already in the repo):**

```
insert into public.notifications (…)
        │
        ▼
Postgres trigger  notifications_fanout_push       ← migration 0006
        │  pg_net.http_post
        ▼
Edge function  send-push                          ← supabase/functions/send-push
        │  FCM HTTP v1 API
        ▼
Google FCM → user's Android device (locked / backgrounded / foreground)
        │
        ▼
@capacitor/push-notifications listeners           ← src/hooks/push.ts
```

---

## 1. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) →
   **Add project** → name it "Maximus Solutions" (or use existing).
2. **Add app → Android**:
   - Package name: `com.maximussolutions.app`
   - SHA-1: paste the SHA-1 from your release keystore (same fingerprint used
     for Google OAuth in `ANDROID-DEPLOY.md` §7).
3. Download `google-services.json` and drop it at:
   ```
   android/app/google-services.json
   ```
   The Google Services Gradle plugin is already wired in
   `android/app/build.gradle` and `android/build.gradle` — it activates
   automatically once the file exists.
4. **Cloud Messaging API (V1)** must be enabled — it is by default on new
   Firebase projects. If you're on an older project, enable it at
   `console.cloud.google.com/apis/library/fcm.googleapis.com`.

## 2. Service account for the edge function

FCM v1 requires OAuth2, which the edge function generates from a service
account key.

1. Firebase Console → **Project Settings → Service accounts → Generate new
   private key**. A `.json` file downloads. Keep it secret — treat it like a
   password.
2. Get your Firebase project ID (Project Settings → General → Project ID,
   e.g. `maximus-solutions-abc12`).

## 3. Deploy the edge function

```bash
# Set secrets (the JSON must be on ONE line — flatten \n newlines yourself)
supabase secrets set FCM_PROJECT_ID=<firebase-project-id>
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<paste JSON as a single line>'

# Deploy
supabase functions deploy send-push --no-verify-jwt
```

Tip for flattening the service-account JSON on Windows (PowerShell):
```powershell
(Get-Content .\service-account.json -Raw) -replace "`r`n","" -replace "`n","" | Set-Clipboard
```
On macOS/Linux:
```bash
tr -d '\n' < service-account.json | pbcopy   # macOS
tr -d '\n' < service-account.json | xclip    # Linux
```

## 4. Apply the migration

```bash
supabase db push        # applies supabase/migrations/0006_push_notifications.sql
```

## 5. Wire the trigger to the edge function

Supabase Managed Postgres does not allow `alter database ... set app.xxx` from
the `postgres` role, so the trigger reads the service_role key from **Supabase
Vault** and uses a hardcoded edge-function URL.

Run once against your project's Postgres (Studio → SQL editor), replacing the
placeholder with the real service_role JWT (Dashboard → Project Settings → API):

```sql
select vault.create_secret(
  '<paste service_role JWT>',
  'push_service_role_key',
  'Bearer used by fanout_notification_push trigger'
);
```

If the vault secret is missing, the trigger becomes a no-op — INSERTs into
`notifications` still succeed, they just don't fan out. This is intentional so
misconfiguration never breaks in-app notifications.

To rotate the key later:
```sql
update vault.secrets set secret = '<new JWT>' where name = 'push_service_role_key';
```

## 6. Rebuild the app

```bash
npm install                    # picks up @capacitor/push-notifications
npm run android:sync           # copies plugin + google-services.json into android/
npm run android:build          # or android:bundle for a release AAB
```

## 7. Test

1. Install the APK/AAB on a real Android device (emulator without Google Play
   won't work).
2. Log in — the app requests the POST_NOTIFICATIONS permission (Android 13+).
   Grant it.
3. In Supabase Studio, run:
   ```sql
   insert into public.notifications (user_id, type, title, body)
   values ('<your-user-uuid>', 'generic', 'Push test', 'If you see this on the lock screen, it works.');
   ```
4. Lock the phone. Within ~1 second a heads-up notification should appear
   with the title and body above.

Also verify a token was captured:
```sql
select id, platform, left(token, 12) as token_prefix, last_seen_at
from public.push_tokens
where user_id = '<your-user-uuid>';
```

## 8. Debugging

| Symptom | Likely cause |
|---|---|
| No row in `push_tokens` after login | User denied POST_NOTIFICATIONS, or the app was built without `google-services.json` — check `android/app/google-services.json` exists before `cap sync` |
| Trigger fires but no notification arrives | `FCM_PROJECT_ID` doesn't match the project the token belongs to, or the service account is from a different project |
| `pg_net.http_post` returns 401 from the edge function | `app.service_role_key` is unset or stale — re-run the `alter database` command |
| Notification arrives but tap does nothing | `pushNotificationActionPerformed` route mapping in `src/hooks/push.ts` — extend as needed |
| Old tokens keep failing | The edge function auto-deletes on `UNREGISTERED` — check the function logs to confirm cleanup |

## 9. What's still TODO

- **iOS push** — needs an APNs auth key uploaded to Firebase Console
  (Project Settings → Cloud Messaging → Apple app configuration). The client
  hook already handles the `ios` platform value and the edge function
  already emits an `apns` block.
- **Web push (PWA on the browser)** — needs a service worker registered with
  `pushManager.subscribe()`, a VAPID key pair, and web-push delivery from the
  edge function instead of FCM. Skipped for now because the PWA is disabled
  in the Capacitor build (see `src/lib/platform.ts`).
- **Per-event routing** — the current tap handler covers `quote_sent`,
  `quote_accepted`, `request_received`. Extend `src/hooks/push.ts`
  `pushNotificationActionPerformed` handler as new notification types are added.
