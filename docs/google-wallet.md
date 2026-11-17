# Google Wallet setup

The integration remains disabled until server configuration is present. No database migration is required.

1. Create a BeLoyal Google Wallet issuer account at https://pay.google.com/business/console.
2. Create a Google Cloud project and enable Google Wallet API.
3. Create a service account; add its email as a Developer in the Wallet console. Generate its JSON key and store credentials only in server environment settings (never commit or paste the private key into chat).
4. Set these environment variables:

```
GOOGLE_WALLET_ENABLED=true
GOOGLE_WALLET_ISSUER_ID=<numeric issuer ID>
GOOGLE_WALLET_CLIENT_EMAIL=<service account email>
GOOGLE_WALLET_PRIVATE_KEY=<private_key from service account JSON, escaped newlines supported>
GOOGLE_WALLET_SITE_URL=https://getbeloyal.app
GOOGLE_WALLET_LOGO_URL=<public HTTPS PNG logo URL>
```

5. Add a test Google account in Wallet console. Open a real test member card, add it to Google Wallet, scan its QR at checkout, earn a stamp, and redeem a reward. Verify balance changes on the saved pass. Existing Apple Wallet flows must also still work.
6. Complete the Business Profile and request publishing access. Until approved, only permitted test accounts can save passes.

One loyalty class is created per business slug. A stable hashed customer ID identifies each loyalty object; QR contents match the existing cashier scanner. Stamp, redemption and feedback reward flows schedule a balance patch independently of Apple's configuration. Missing Google objects are ignored during sync; ordinary stamp transactions never create unsolicited passes.

This implementation adds pass issuance and balance updates. Owner campaigns, location relevance, per-business logo selection and Google notification sending are not yet implemented. Updates are best effort; monitor failures and add durable retries before promising guaranteed synchronization. The text button should be replaced with an official localized Google Wallet badge before public release.

References:
- https://developers.google.com/wallet/retail/loyalty-cards/getting-started/onboarding-guide
- https://developers.google.com/wallet/retail/loyalty-cards/web
- https://developers.google.com/wallet/retail/loyalty-cards/use-cases/trigger-push-notifications
