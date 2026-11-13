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
No database migration is required. No broadcast or scheduled campaigns exist.
