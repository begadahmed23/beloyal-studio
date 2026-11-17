const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
Object.assign(process.env, { GOOGLE_WALLET_ENABLED: 'true', GOOGLE_WALLET_ISSUER_ID: '123', GOOGLE_WALLET_CLIENT_EMAIL: 'test@example.com', GOOGLE_WALLET_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }), GOOGLE_WALLET_SITE_URL: 'https://example.com', GOOGLE_WALLET_LOGO_URL: 'https://example.com/logo.png' });
const member = { id: 'one', publicToken: 'a'.repeat(48), name: 'Test', memberNumber: 'BL-1', stamps: 3, rewardEarnedAt: null, cafe: { slug: 'cafe', name: 'Cafe', businessType: 'CAFE', rewardTarget: 7, rewardName: 'Cookie', backgroundColor: '#123456' } };
const calls = [];
let patchStatus = 200;
const source = ts.transpileModule(fs.readFileSync('lib/wallet/google.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(source, { exports: moduleObject.exports, require: id => id === '@/lib/prisma' ? { prisma: { customer: { findUnique: async () => member } } } : id.includes('loyalty-target') ? { getLoyaltyProgressTarget: cafe => cafe.businessType === 'CAFE' ? cafe.rewardTarget - 1 : cafe.rewardTarget } : require(id), Buffer, URL, URLSearchParams, AbortSignal, process, console,
  fetch: async (url, options) => { calls.push({ url, ...options }); if (url.includes('oauth2')) return { ok: true, json: async () => ({ access_token: 'test', expires_in: 3600 }) }; const status = options.method === 'PATCH' ? patchStatus : 409; return { ok: status === 200, status }; } });
const wallet = moduleObject.exports;
test('save flow signs a verifiable JWT and handles existing classes and objects', async () => {
 const url = await wallet.createGoogleWalletLink(member);
 const token = url.split('/save/')[1]; const [header, payload, signature] = token.split('.');
 assert.equal(crypto.verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url')), true);
 const data = JSON.parse(Buffer.from(payload, 'base64url'));
 assert.equal(data.typ, 'savetowallet'); assert.equal(data.payload.loyaltyObjects.length, 1);
 const object = JSON.parse(calls.find(call => call.method === 'PATCH' && call.url.includes('loyaltyObject/')).body);
 assert.equal(object.loyaltyPoints.balance.string, '3/6'); assert.equal(object.barcode.value, `BL:${member.publicToken}`);
 assert.ok(!object.id.includes(member.publicToken));
});
test('missing passes do not get created by balance sync; API failures surface', async () => {
 calls.length = 0; patchStatus = 404; await wallet.syncGoogleWalletMember(member.id);
 assert.equal(calls.length, 1); assert.equal(calls[0].method, 'PATCH');
 patchStatus = 500; await assert.rejects(wallet.syncGoogleWalletMember(member.id));
});
test('reward state and barber target match existing loyalty rules', () => {
 const object = wallet.googleWalletObject({ ...member, stamps: 3, cafe: { ...member.cafe, businessType: 'BARBERSHOP', rewardTarget: 3 } });
 assert.equal(object.loyaltyPoints.balance.string, '3/3'); assert.equal(object.loyaltyPoints.label, 'REWARD READY');
});

test('private key copies support raw PEM, JSON strings and service-account JSON', () => {
 const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
 for (const value of [pem, JSON.stringify(pem), JSON.stringify({ private_key: pem }), pem.replace(/\n/g, '\\n')]) {
   const normalized = wallet.normalizeGoogleWalletKey(value);
   assert.doesNotThrow(() => crypto.createPrivateKey(normalized));
 }
});

test('business branding and nearby coordinates are scoped to the class', () => {
 const brand = wallet.googleClassBrand({...member.cafe, logoUrl:'https://example.com/cafe.png'}, {nearbyEnabled:true, nearbyLatitude:31.2, nearbyLongitude:29.9});
 assert.equal(brand.programLogo.sourceUri.uri,'https://example.com/cafe.png');
 assert.equal(brand.merchantLocations[0].latitude,31.2);
 assert.equal(wallet.googleClassBrand(member.cafe,{nearbyEnabled:false}).merchantLocations.length,0);
});
