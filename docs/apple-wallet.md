# Apple Wallet setup and testing

The pass displays Loretto's ivory/sage artwork, stamp circles, member details,
and reward state. Other businesses use their saved background color and name.
Café targets use the existing N−1 rule; barbers use the exact paid-visit target.
The QR payload remains `BL:<publicToken>`.

## Private local configuration

Keep these in the ignored `.env.local`. Replace the home path and site origin:

```
APPLE_WALLET_ENABLED=true
APPLE_WALLET_TEAM_ID=73RR7GW9R6
APPLE_WALLET_PASS_TYPE_ID=pass.com.getbeloyal.loyalty
APPLE_WALLET_SITE_URL=https://YOUR_PUBLIC_TEST_ORIGIN
APPLE_WALLET_CERT_PATH=/Users/YOUR_USER/BeLoyal-Wallet/pass.pem
APPLE_WALLET_KEY_PATH=/Users/YOUR_USER/BeLoyal-Wallet/beloyal-20261111121408.key
APPLE_WALLET_WWDR_PATH=/Users/YOUR_USER/BeLoyal-Wallet/wwdr.pem
APPLE_WALLET_WEB_SERVICE_URL=https://YOUR_PUBLIC_TEST_ORIGIN/api/wallet/service
APPLE_WALLET_AUTH_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

Generate the auth secret locally using `openssl rand -hex 32`; never share it.
Keep it stable: rotating it invalidates installed passes' update authentication.
Use a different secret per environment. Keep the same public HTTPS origin for
as long as the installed test pass is in use. Localhost can generate passes but
iPhone cannot register for automatic updates with it. Set both URLs to the public
origin, restart the app, and download the pass again after configuring updates.
Existing prototype passes lack webServiceURL; replace them with the new pass.

`DATABASE_URL` must target the Wallet test branch for testing. Preserve the
existing Upstash Redis URL/token; registration keys are isolated by service URL
and pass type. This implementation adds no database tables or migrations.
Registration storage must be durable; deleting Redis data stops pushes until
Wallet re-registers its passes. Do not give these keys a short cache TTL.

For hosted testing, put PEM contents in the server-only `APPLE_WALLET_CERT_PEM`,
`APPLE_WALLET_KEY_PEM`, and `APPLE_WALLET_WWDR_PEM` environment variables instead
of file paths. Literal `\n` sequences are supported. Never use `NEXT_PUBLIC_`
variables for credentials. Optional encrypted-key password:
`APPLE_WALLET_KEY_PASSPHRASE`.

## Update behavior

The service implements Apple's register, unregister, list-updates, fetch-pass,
and diagnostic endpoints under `/api/wallet/service/v1`. Pass-specific HMAC
credentials authorize registration, unregistration, and downloads. Registration
persists a many-to-many device/pass mapping and push tokens in Redis. Customer
and business update timestamps determine which registered passes have changed.
Diagnostic payloads are discarded to avoid leaking bearer data into logs.

Successful stamp, redemption, and feedback reward transactions schedule a
best-effort APNs wake-up after the cashier response. A failed push never rolls
back the stamp. Expired APNs tokens are removed; transient failures are logged
without credentials. There is no durable retry queue yet. Wallet can fetch the
latest state by manual refresh when pushes fail. Business settings/name changes
are reflected on the next refresh or member-transaction push, rather than a
broadcast to every installed card.

Wallet refresh timing is controlled by Apple and device connectivity. Successful
local tests do not establish production APNs delivery or instant refresh.

## Validation

Run `node --test tests/apple-wallet.test.cjs` (Node, OpenSSL, installed deps).
The offline tests use temporary certificates and mocked Neon/Redis/APNs; no
credentials or database connections are required. Also run `npx tsc --noEmit`.

On a real iPhone:

1. Set public HTTPS URLs and the auth secret, restart, download/add a fresh pass.
2. Confirm the business artwork, member name, and current stamp total.
3. Confirm the registration endpoint receives a request and returns 201/200.
4. Scan in the cashier flow and stamp; check online and Wallet totals agree.
5. Redeem a ready reward; verify Wallet resets to the actual online balance.
6. Test feedback rewards, multiple devices, manual refresh, and pass removal.
7. Check an invalid auth token returns 401, unknown pass returns 404, and
   disabling updates returns 503 without exposing signing details.

The current text Add to Apple Wallet button remains a pilot. Replace it with
Apple's approved badge before public launch. To disable downloads, remove
`APPLE_WALLET_ENABLED=true`; to disable updates only, remove the service URL.

## Single-card Loretto notification test

Super-admins can open `/studio/wallet-test`, paste their own customer card link,
and check registered device count. Refresh the installed pass first to load the
stable `member-message` field, then send the fixed test message. This pilot only
accepts active Loretto cards and never changes stamps or reward eligibility.
A per-card one-minute lock limits repeated requests; identical messages are not
resent. Messages persist in the environment-isolated Wallet Redis namespace.
Message timestamps participate in discovery and Last-Modified, independently of
customer timestamps. The result reports APNs acceptance, not visible delivery.
No database migration is required. This original pilot sends one fixed test update.

## Wallet campaigns

- Super-admin: `/studio/campaigns` (business selector). Business admin:
  `/campaigns` (standalone page outside the dashboard layout; own business only).
  The old `/dashboard/campaigns` URL redirects. Cashiers have no access.
  Pilot access is restricted by immutable Loretto business ID in
  `lib/wallet/campaign-access.ts`, enforced in the API, standalone page, Studio
  business list, and desktop/mobile navigation. Other businesses are not enabled.
- `/api/wallet/campaigns` requires administrator authentication, validates the
  business scope on every request, checks active subscriptions for business
  admins and validates same-origin mutations.
- Audience membership comes from existing per-pass registration hashes: a
  customer qualifies when at least one registered device remains. This is not
  proof of notification permissions, a notification view, or continued install
  if the device never unregisters. Removing the last registration excludes them.
- Birthday segments use the business timezone. Today and next seven days are
  separate choices; the latter includes today. Feb 29 maps to Feb 28 in non-leap
  years, matching birthday reward handling.
- Inactivity uses the last recorded transaction except feedback bonus entries.
  No-visit members qualify based on joining age. 30+ is a subset of 14+.
- Preview freezes one business, exact recipient IDs, segment and message for ten
  minutes. It never sends pushes. Final Send rechecks eligibility, ownership and
  registration. At most 50 recipients per campaign; choose multiple batches for
  larger groups. An unchanged message is skipped.
- Campaign claims prevent replay, and a business lock prevents overlapping
  sends. Member results are checkpointed in Redis after each group of five.
  History retains up to the last 20 indexed campaigns for 30 days (UI shows 10).
  Messages persist until replaced; no TTL that could cause a reversal alert.
- Delivery is synchronous with a 300-second route allowance, not a durable job
  queue. If execution is interrupted, history can retain `sending`/pending
  recipients. Do not automatically replay those campaigns: review first.
- Accepted means APNs accepted at least one device update, not customer-visible
  delivery. No open/read tracking or automatic campaign schedule is provided.
- No schema migrations or customer/stamp/reward writes are introduced. Existing
  Wallet updates and the QR scanner payload are preserved.

Offline checks: `node --test tests/apple-wallet.test.cjs tests/wallet-campaigns.test.cjs`,
`npx tsc --noEmit`, and `npm run build`. No live messages are sent by these tests.

## Automatic notification extras and ready rewards

The Loretto pilot includes a `reward_ready` audience, using the same readiness
rule as the signed pass: `rewardEarnedAt` exists or stamps reach the existing
business-specific target. Café N−1 and barbershop exact-target rules remain.
Redemption removes readiness when the existing flow clears the flag/balance.

Optional `stampSuffix` and `rewardSuffix` (100 characters each) are stored per
business in the Wallet Redis namespace, editable in Settings → Wallet
notifications or on the campaigns page. The authenticated notifications API
allows only these fields, validates café scope/pilot access and rejects edits
to count, target, and reward-name properties. Saving schedules no push and
changes no database rows; future transaction-driven pass fetches apply it.

The existing `balance` field and its `%@` substitution are preserved. Stamp
messages keep the system-generated balance. Ready messages include that balance
and the café’s actual `rewardName`. User-authored percent signs are escaped for
Apple’s formatting syntax. Blank extras use default wording. Other businesses
retain their original pass notification behavior. Campaign card messages stay
independent and are never overwritten by these automatic suffixes.

The third optional field, `resetSuffix`, adds a separate start-over sentence
when a non-ready balance resets to zero. Its default is “A fresh start towards
your next reward ✨”. The real `0/target` balance remains the protected field
value. Blank reset text keeps just the default progress statement. Existing
stored stamp/reward extras are merged with the new default when read; legacy
clients that omit `resetSuffix` preserve its saved value. Saving settings still
sends nothing. This does not change redemption, stamp, or reward transactions.
