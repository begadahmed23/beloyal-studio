# Apple Wallet pilot

This pilot creates a signed store card with business name, background color,
member name/number, and the existing `BL:<publicToken>` QR payload. It links to
live online progress. It does not yet implement pass registration, APNs push,
or automatic stamp updates. It deliberately omits a stale stamp balance.
No schema migration is required.

## Local setup

Add these variables to your ignored `.env.local` file. Replace `/Users/YOUR_USER`
with your actual home directory; environment values do not expand `~` or `$HOME`.

```
APPLE_WALLET_ENABLED=true
APPLE_WALLET_TEAM_ID=73RR7GW9R6
APPLE_WALLET_PASS_TYPE_ID=pass.com.getbeloyal.loyalty
APPLE_WALLET_SITE_URL=https://YOUR_BELOYAL_DOMAIN
APPLE_WALLET_CERT_PATH=/Users/YOUR_USER/BeLoyal-Wallet/pass.pem
APPLE_WALLET_KEY_PATH=/Users/YOUR_USER/BeLoyal-Wallet/beloyal-20261111121408.key
APPLE_WALLET_WWDR_PATH=/Users/YOUR_USER/BeLoyal-Wallet/wwdr.pem
```

Restart the development server. Existing database and Upstash settings are needed.
Use the development database for testing. No database migrations, resets,
or pushes are needed.

For hosted environments, use the server-only `APPLE_WALLET_CERT_PEM`,
`APPLE_WALLET_KEY_PEM`, and `APPLE_WALLET_WWDR_PEM` variables containing PEM text.
Literal `\n` sequences are supported. Do not use `NEXT_PUBLIC_` variables,
commit credentials, or paste the private key into chats.
Optional: `APPLE_WALLET_KEY_PASSPHRASE` for encrypted keys.

## Acceptance checks before enabling in production

- Add a test customer's card using Safari on a real iPhone and inspect the design.
- Scan its QR in the existing cashier flow; verify it resolves the same member.
- Confirm invalid tokens and inactive businesses return 404.
- Verify missing configuration hides the button and download returns 503.
- Verify a signing error shows a retry message without exposing secrets.
- Check each business's colors/name, non-ASCII member names, and long names.
- Confirm the online progress link opens the correct card.

The current text button is for the pilot. Replace it with Apple's approved Add
to Apple Wallet badge before public launch. Add the Wallet web service and APNs
integration before promising automatic stamp updates. Real Apple certificate
trust and iOS installation require device testing; temporary signing tests alone
do not establish that Apple Wallet will accept the production pass.

Disable the feature by removing `APPLE_WALLET_ENABLED=true` and redeploying.
