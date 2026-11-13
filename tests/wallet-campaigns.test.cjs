/* Offline campaign tests; no databases, live Redis, or actual notifications. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');
function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const req = id => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('@/') ? load(id.slice(2) + '.ts') : id.startsWith('.') ? load(path.resolve(path.dirname(filename), id) + '.ts') : require(id);
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(req, module, module.exports);
    return module.exports;
  }
  return load;
}
const segments = loader()('lib/wallet/campaign-segments.ts');
test('birthday windows respect Cairo midnight, year rollover and leap birthdays', () => {
  assert.equal(segments.daysUntilBirthday(new Date('2000-11-14'), new Date('2026-11-13T22:30:00Z'), 'Africa/Cairo'), 0);
  assert.equal(segments.daysUntilBirthday(new Date('2000-01-02'), new Date('2026-12-31T12:00:00Z'), 'Africa/Cairo'), 2);
  assert.equal(segments.daysUntilBirthday(new Date('2000-02-29'), new Date('2027-02-28T12:00:00Z'), 'Africa/Cairo'), 0);
  assert.equal(segments.daysUntilBirthday(new Date('2000-02-29'), new Date('2028-02-28T12:00:00Z'), 'Africa/Cairo'), 1);
});
test('inactivity boundaries use visits, or joining for members with no visit', () => {
  const now = new Date('2026-11-13T12:00:00Z'), birthday = new Date('2000-01-01');
  const daysAgo = d => new Date(+now - d * 86400000);
  const get = (created, visit) => segments.memberSegments(birthday, daysAgo(created), visit === null ? null : daysAgo(visit), now, 'Africa/Cairo');
  assert.ok(!get(100, 13.999).segments.includes('inactive_14'));
  assert.ok(get(100, 14).segments.includes('inactive_14'));
  assert.ok(!get(100, 29.999).segments.includes('inactive_30'));
  assert.ok(get(100, 30).segments.includes('inactive_30'));
  assert.ok(!get(1, null).segments.includes('inactive_14'));
  assert.ok(get(30, null).segments.includes('inactive_30'));
});
test('audience excludes unregistered cards and scopes query to business', async () => {
  let query;
  const base = { birthday: new Date('2000-01-01'), createdAt: new Date('2020-01-01'), transactions: [], name: 'Member', memberNumber: '1' };
  const lib = loader({ '@/lib/prisma': { prisma: { customer: { findMany: async q => { query = q; return [{ ...base, id: 'installed' }, { ...base, id: 'removed' }]; } } } },
    './updates': { passKey: x => x, walletRedis: () => ({ pipeline: () => ({ hlen() {}, exec: async () => [2, 0] }) }) },
  })('lib/wallet/campaigns.ts');
  const result = await lib.walletAudience('cafe1', 'Africa/Cairo');
  assert.equal(query.where.cafeId, 'cafe1');
  assert.equal(query.select.transactions.take, 1);
  assert.match(JSON.stringify(query.select.transactions.where), /Feedback/);
  assert.equal(result.totalMembers, 2);
  assert.deepEqual(result.members.map(m => m.id), ['installed']);
  assert.equal(result.members[0].devices, 2);
});
function routeFor(auth, extra = {}) {
  return loader({ '@/lib/require-auth': { requireAuth: async () => auth },
    '@/lib/require-active-cafe': { requireActiveCafe: async () => ({ allowed: true }) },
    '@/lib/wallet/config': { walletUpdatesEnabled: () => true },
    '@/lib/prisma': { prisma: { cafe: { findFirst: async () => ({ id: 'cafe1', name: 'Loretto', timezone: 'Africa/Cairo' }) } } },
    ...extra,
  })('app/api/wallet/campaigns/route.ts');
}
const admin = { user: { id: 'admin1', role: 'CAFE_ADMIN' }, cafeId: 'cafe1', isSuperAdmin: false, isCashier: false };
const post = body => new NextRequest('https://example.com/api/wallet/campaigns', { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('cashiers and cross-business access are rejected before audience access', async () => {
  assert.equal((await routeFor({ ...admin, isCashier: true }).GET(new NextRequest('https://example.com/api/wallet/campaigns?cafeId=cafe1'))).status, 403);
  assert.equal((await routeFor(admin).GET(new NextRequest('https://example.com/api/wallet/campaigns?cafeId=other'))).status, 403);
  assert.equal((await routeFor(null).POST(post({}))).status, 403);
});
test('preview rejects stale/unregistered selections; preview never sends a push', async () => {
  let previews = 0;
  const route = routeFor(admin, { '@/lib/wallet/campaigns': { walletAudience: async () => ({ members: [{ id: 'yes', name: 'Begad', memberNumber: '1', segments: ['all'] }] }),
    createCampaign: async data => { previews++; return data; }, sendCampaign: () => { throw Error('Preview sent a notification'); } } });
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: 'Hello', customerIds: ['removed'] }))).status, 409);
  assert.equal(previews, 0);
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: 'Hello', customerIds: ['yes'] }))).status, 200);
  assert.equal(previews, 1);
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: ' ', customerIds: ['yes'] }))).status, 400);
});
test('sending rechecks eligibility, skips unchanged/removed cards and claims once', async () => {
  const records = new Map(); let pushes = 0;
  const redis = { set: async (key, value, opts) => { if (opts?.nx && records.has(key)) return null; records.set(key, structuredClone(value)); return 'OK'; }, get: async key => records.get(key),
    zadd: async () => 1, zremrangebyrank: async () => 0, hlen: async key => key.includes('removed') ? 0 : 1 };
  const lib = loader({ '@/lib/prisma': { prisma: { customer: { findFirst: async ({ where }) => where.cafeId === 'cafe1' ? { id: where.id } : null } } },
    './updates': { passKey: id => id, walletRedis: () => redis, notifyWalletMember: async () => { pushes++; return { accepted: 1, failed: 0 }; } },
    './messages': { getWalletMessage: async id => id === 'same' ? { text: 'Hello' } : null, setWalletMessage: async () => {} },
  })('lib/wallet/campaigns.ts');
  const draft = { id: 'test', cafeId: 'cafe1', business: 'Loretto', createdBy: 'admin1', segment: 'all', message: 'Hello', createdAt: Date.now(), status: 'draft',
    recipients: ['ok', 'removed', 'same', 'visited-again'].map(id => ({ id, name: id, memberNumber: id, status: 'pending' })) };
  const eligible = new Set(['ok', 'removed', 'same']);
  const result = await lib.sendCampaign(structuredClone(draft), eligible);
  assert.equal(pushes, 1);
  assert.deepEqual(result.recipients.map(r => r.status), ['accepted', 'skipped', 'skipped', 'skipped']);
  const retry = await lib.sendCampaign(structuredClone(draft), eligible);
  assert.equal(pushes, 1);
  assert.equal(retry.status, 'complete');
});
