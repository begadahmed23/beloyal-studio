/* Offline integration tests: temporary certificates only; no Neon, Redis, or APNs requests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    }}).outputText;
    const customRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('@/')) return load(id.slice(2) + '.ts');
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id) + '.ts');
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(customRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'beloyal-wallet-'));
execFileSync('openssl', ['req','-x509','-newkey','rsa:2048','-nodes','-keyout',`${tmp}/key.pem`,'-out',`${tmp}/cert.pem`,'-days','1','-subj','/CN=Offline Wallet Test'], { stdio: 'ignore' });
Object.assign(process.env, {
  APPLE_WALLET_ENABLED: 'true', APPLE_WALLET_TEAM_ID: 'TESTTEAM12',
  APPLE_WALLET_PASS_TYPE_ID: 'pass.com.example.test', APPLE_WALLET_SITE_URL: 'https://example.com',
  APPLE_WALLET_CERT_PATH: `${tmp}/cert.pem`, APPLE_WALLET_KEY_PATH: `${tmp}/key.pem`,
  APPLE_WALLET_WWDR_PATH: `${tmp}/cert.pem`, APPLE_WALLET_AUTH_SECRET: 'offline-test-secret-'.repeat(3),
  APPLE_WALLET_WEB_SERVICE_URL: 'https://example.com/api/wallet/service',
});
const load = loader();
const config = load('lib/wallet/config.ts');
const member = { id: 'member123', publicToken: 'a'.repeat(48), name: 'Begad أحمد', memberNumber: 'BL-001',
  stamps: 3, rewardEarnedAt: null, updatedAt: new Date('2026-11-11T10:00:00Z'),
  cafe: { name: 'Loretto', slug: 'loretto', businessType: 'CAFE', theme: 'DARK_LUXURY',
    rewardTarget: 7, rewardName: 'Free drink', primaryColor: '#000000', backgroundColor: '#000000', updatedAt: new Date('2026-11-10') } };

// Read the ZIP central directory using Node built-ins (stored/deflated entries).
const strFromU8 = (value) => Buffer.from(value).toString();
function unzipSync(input) {
  const bytes = Buffer.from(input), result = {};
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0);
  const count = bytes.readUInt16LE(end + 10);
  let entry = bytes.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(entry), 0x02014b50);
    const method = bytes.readUInt16LE(entry+10), length = bytes.readUInt32LE(entry+20);
    const nameLength = bytes.readUInt16LE(entry+28), extra = bytes.readUInt16LE(entry+30), comment = bytes.readUInt16LE(entry+32);
    const name = bytes.subarray(entry+46,entry+46+nameLength).toString();
    const local = bytes.readUInt32LE(entry+42);
    const start = local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
    const data = bytes.subarray(start,start+length);
    result[name] = method === 8 ? require('node:zlib').inflateRawSync(data) : data;
    entry += 46+nameLength+extra+comment;
  }
  return result;
}
test('signed artwork, stamp progress, auth and existing scanner payload', async () => {
  const { createAppleWalletPass } = load('lib/wallet/apple.ts');
  const bytes = await createAppleWalletPass(member);
  const zip = unzipSync(bytes); const pass = JSON.parse(strFromU8(zip['pass.json']));
  assert.equal(pass.serialNumber, member.id);
  assert.equal(pass.barcodes[0].message, `BL:${member.publicToken}`);
  assert.equal(pass.backgroundColor, 'rgb(243, 235, 221)');
  assert.equal(pass.storeCard.headerFields[0].value, '3/6');
  assert.equal(pass.storeCard.secondaryFields[0].value, member.name);
  assert.equal(pass.webServiceURL, process.env.APPLE_WALLET_WEB_SERVICE_URL);
  assert.equal(pass.authenticationToken, config.walletAuthToken(member.id));
  assert.ok(zip['strip@3x.png'].length > 500);
  if (process.env.WALLET_PREVIEW_DIR) fs.writeFileSync(path.join(process.env.WALLET_PREVIEW_DIR, 'loretto-strip.png'), zip['strip@3x.png']);
  const manifest = JSON.parse(strFromU8(zip['manifest.json']));
  for (const [name, hash] of Object.entries(manifest)) assert.equal(require('crypto').createHash('sha1').update(zip[name]).digest('hex'), hash);
  fs.writeFileSync(`${tmp}/signature`,zip.signature); fs.writeFileSync(`${tmp}/manifest`,zip['manifest.json']);
  execFileSync('openssl',['smime','-verify','-inform','DER','-in',`${tmp}/signature`,'-content',`${tmp}/manifest`,'-noverify','-out',process.platform === 'win32' ? 'NUL' : '/dev/null'], { stdio:'ignore' });
  const reward = JSON.parse(strFromU8(unzipSync(await createAppleWalletPass({ ...member, stamps: 7, rewardEarnedAt: new Date() }))['pass.json']));
  assert.equal(reward.storeCard.headerFields[0].value, '6/6');
  assert.equal(reward.storeCard.headerFields[0].label, 'REWARD READY');
  const barber = JSON.parse(strFromU8(unzipSync(await createAppleWalletPass({ ...member, cafe: { ...member.cafe, businessType: 'BARBERSHOP' } }))['pass.json']));
  assert.equal(barber.storeCard.headerFields[0].value, '3/7');
  const walidZip = unzipSync(await createAppleWalletPass({ ...member, stamps: 2, cafe: { ...member.cafe,
    name: 'Waleed saad', slug: 'walid-saad', businessType: 'BARBERSHOP', rewardTarget: 3,
    rewardName: 'Free Haircut', primaryColor: '#9B6546', backgroundColor: '#0E1513' } }));
  const walid = JSON.parse(strFromU8(walidZip['pass.json']));
  assert.equal(walid.storeCard.headerFields[0].label, 'VISITS');
  assert.equal(walid.storeCard.headerFields[0].value, '2/3');
  assert.equal(walid.backgroundColor, 'rgb(14, 21, 19)');
  assert.equal(walid.foregroundColor, 'rgb(242, 238, 231)');
  assert.equal(walid.storeCard.auxiliaryFields[0].value, 'Free Haircut');
  assert.equal(walid.barcodes[0].message, `BL:${member.publicToken}`);
  if (process.env.WALLET_PREVIEW_DIR) {
    fs.writeFileSync(path.join(process.env.WALLET_PREVIEW_DIR, 'walid-strip.png'), walidZip['strip@3x.png']);
    fs.writeFileSync(path.join(process.env.WALLET_PREVIEW_DIR, 'walid-logo.png'), walidZip['logo@3x.png']);
  }

});

test('authentication is bound to serial, rejects malformed tokens, HTTPS required', () => {
  assert.equal(config.validWalletAuth(member.id, `ApplePass ${config.walletAuthToken(member.id)}`), true);
  assert.equal(config.validWalletAuth('another', `ApplePass ${config.walletAuthToken(member.id)}`), false);
  assert.equal(config.validWalletAuth(member.id, 'ApplePass no'), false);
  assert.equal(config.validWalletAuth(member.id, config.walletAuthToken(member.id)), false);
  const saved = process.env.APPLE_WALLET_WEB_SERVICE_URL;
  process.env.APPLE_WALLET_WEB_SERVICE_URL = 'http://localhost:3000';
  assert.equal(config.walletUpdatesEnabled(), false);
  process.env.APPLE_WALLET_WEB_SERVICE_URL = saved;
});

test('Wallet registration, idempotency, update discovery, authorization, and download', async () => {
  const registrations = new Set(); let push; let reads = 0;
  const route = loader({
    '@/lib/prisma': { prisma: {
      customer: { findFirst: async () => { reads++; return member; }, findMany: async () => [member] },
    } },
    '@/lib/public-api-security': { publicApiRateLimiters: { card: 'card' }, applyPublicRateLimit: async () => null },
    '@/lib/wallet/updates': {
      deviceKey: (id) => id, walletRedis: () => ({ smembers: async () => [...registrations] }),
      registerWalletDevice: async (_device, serial, token) => { push = token; const n = registrations.has(serial) ? 0 : 1; registrations.add(serial); return n; },
      unregisterWalletDevice: async (_device, serial) => { registrations.delete(serial); },
    },
  })('app/api/wallet/service/v1/[...path]/route.ts');
  const auth = { authorization: `ApplePass ${config.walletAuthToken(member.id)}` };
  const type = process.env.APPLE_WALLET_PASS_TYPE_ID;
  const registration = ['devices','device123','registrations',type,member.id];
  const request = (method, parts, headers = {}, body, query = '') => route[method](new NextRequest(`https://example.com/api/wallet/service/v1/${parts.join('/')}${query}`, {
    method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
  }), { params: Promise.resolve({ path: parts }) });
  assert.equal((await request('POST', registration, {}, { pushToken: 'f'.repeat(64) })).status,401);
  assert.equal(reads,0);
  assert.equal((await request('POST', registration, auth, { pushToken: 'f'.repeat(64) })).status,201);
  assert.equal((await request('POST', registration, auth, { pushToken: 'e'.repeat(64) })).status,200);
  assert.equal(push,'e'.repeat(64));
  const listing = registration.slice(0,4);
  const discovery = await request('GET',listing);
  assert.equal(discovery.status,200);
  const data = await discovery.json(); assert.deepEqual(data.serialNumbers,[member.id]);
  assert.equal((await request('GET',listing,{},null,`?passesUpdatedSince=${data.lastUpdated}`)).status,204);
  member.updatedAt = new Date(member.updatedAt.getTime() + 1);
  assert.equal((await request('GET',listing,{},null,`?passesUpdatedSince=${data.lastUpdated}`)).status,200);
  const download = await request('GET',['passes',type,member.id],auth);
  assert.equal(download.status,200); assert.equal(download.headers.get('content-type'),'application/vnd.apple.pkpass');
  assert.equal((await request('POST',registration,auth,{pushToken:'invalid'})).status,400);
  assert.equal((await request('POST',registration,auth,{pushToken:'f'.repeat(4000)})).status,413);
  assert.equal((await request('GET',['passes','wrong',member.id],auth)).status,404);
  assert.equal((await request('DELETE',registration,auth)).status,200);
  assert.equal((await request('GET',listing)).status,204);
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

test('push runs after response, removes expired device tokens, and contains delivery failures', async () => {
  const { EventEmitter } = require('node:events');
  const pending = [], removals = [], requests = [];
  let registrations;
  const update = loader({
    'next/server': { after: (callback) => pending.push(callback) },
    '@upstash/redis': { Redis: class {
      async hgetall() { return registrations; }
      async eval(script, keys, args) { removals.push({ script, keys, args }); return 1; }
    } },
    'node:http2': { connect: (_url, credentials) => {
      assert.ok(credentials.cert.length); assert.ok(credentials.key.length);
      const session = new EventEmitter(); session.destroy = () => {};
      session.request = (headers) => {
        requests.push(headers); const request = new EventEmitter();
        request.end = (payload) => {
          assert.equal(payload, '{}');
          queueMicrotask(() => {
            if (headers[':path'].endsWith('c'.repeat(64))) request.emit('error', new Error('offline simulated failure'));
            else { request.emit('response', { ':status': headers[':path'].endsWith('b'.repeat(64)) ? 410 : 200 }); request.emit('end'); }
          });
        };
        return request;
      };
      queueMicrotask(() => session.emit('connect')); return session;
    } },
  })('lib/wallet/updates.ts');
  registrations = { active: 'a'.repeat(64), expired: 'b'.repeat(64) };
  update.scheduleWalletUpdate(member.id);
  assert.equal(requests.length,0); assert.equal(pending.length,1);
  await pending[0]();
  assert.equal(requests.length,2); assert.equal(removals.length,1);
  assert.deepEqual(removals[0].args,[member.id,'expired']);
  assert.equal(requests[0]['apns-topic'],process.env.APPLE_WALLET_PASS_TYPE_ID);
  const original = process.env.APPLE_WALLET_WEB_SERVICE_URL;
  const firstKey = update.passKey(member.id);
  process.env.APPLE_WALLET_WEB_SERVICE_URL = 'https://another.example.com/api/wallet/service';
  assert.notEqual(firstKey,update.passKey(member.id));
  process.env.APPLE_WALLET_WEB_SERVICE_URL = original;
  registrations = { broken: 'c'.repeat(64) };
  await assert.doesNotReject(() => update.notifyWalletMember(member.id));
});
