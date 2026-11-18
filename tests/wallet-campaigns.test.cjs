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
test('audience lists saved cards with consent status and keeps Apple available on Google failure', async () => {
  let query, failGoogle = false;
  const base = { stamps: 0, rewardEarnedAt: null, cafe: { businessType: 'CAFE', rewardTarget: 7 }, birthday: new Date('2000-01-01'), createdAt: new Date('2020-01-01'), transactions: [], name: 'Member', memberNumber: '1' };
  const rows = [
    { ...base, id: 'installed', marketingConsentAt: new Date() },
    { ...base, id: 'missing' },
    { ...base, id: 'withdrawn', marketingConsentAt: new Date(), marketingWithdrawnAt: new Date() },
    { ...base, id: 'google', marketingConsentAt: new Date() },
    { ...base, id: 'removed' },
  ];
  const lib = loader({
    '@/lib/prisma': { prisma: { customer: { findMany: async q => { query = q; return rows; } }, cafe: { findUnique: async () => ({ slug: 'loretto' }) } } },
    './config': { walletUpdatesEnabled: () => true },
    './google': { googleWalletObjectId: id => id, googleWalletSavedObjects: async () => {
      if (failGoogle) throw new Error('unavailable');
      return new Set(['google']);
    } },
    './updates': { passKey: x => x, walletRedis: () => ({ pipeline: () => ({ hlen() {}, exec: async () => [2, 1, 1, 0, 0] }) }) },
  })('lib/wallet/campaigns.ts');
  const result = await lib.walletAudience('cafe1', 'Africa/Cairo');
  assert.equal(query.where.cafeId, 'cafe1');
  assert.equal(query.select.transactions.take, 1);
  assert.match(JSON.stringify(query.select.transactions.where), /Feedback/);
  assert.equal(result.totalMembers, 5);
  assert.equal(result.walletMembers, 4);
  assert.equal(result.googleUnavailable, false);
  assert.deepEqual(result.members.map(({ id, offersStatus }) => [id, offersStatus]), [
    ['installed', 'enabled'], ['missing', 'missing'], ['withdrawn', 'withdrawn'], ['google', 'enabled'],
  ]);
  assert.equal(result.members[0].devices, 2);
  failGoogle = true;
  const fallback = await lib.walletAudience('cafe1', 'Africa/Cairo');
  assert.equal(fallback.googleUnavailable, true);
  assert.deepEqual(fallback.members.map(member => member.id), ['installed', 'missing', 'withdrawn']);
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
  const route = routeFor(admin, { '@/lib/wallet/campaigns': { walletAudience: async () => ({ members: [
      { id: 'yes', name: 'Begad', memberNumber: '1', offersStatus: 'enabled', segments: ['all'] },
      { id: 'no', name: 'Test', memberNumber: '2', offersStatus: 'missing', segments: ['all'] },
    ] }),
    createCampaign: async data => { previews++; return data; }, sendCampaign: () => { throw Error('Preview sent a notification'); } } });
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: 'Hello', customerIds: ['removed'] }))).status, 409);
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: 'Hello', customerIds: ['no'] }))).status, 409);
  assert.equal(previews, 0);
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: 'Hello', customerIds: ['yes'] }))).status, 200);
  assert.equal(previews, 1);
  assert.equal((await route.POST(post({ action: 'preview', cafeId: 'cafe1', segment: 'all', message: ' ', customerIds: ['yes'] }))).status, 400);
});
test('sending rechecks eligibility, skips unchanged/removed cards and claims once', async () => {
  const records = new Map(); let pushes = 0;
  const redis = { set: async (key, value, opts) => { if (opts?.nx && records.has(key)) return null; records.set(key, structuredClone(value)); return 'OK'; }, get: async key => records.get(key),
    zadd: async () => 1, zremrangebyrank: async () => 0, hlen: async key => key.includes('removed') ? 0 : 1 };
  const lib = loader({ '@/lib/prisma': { prisma: { customer: { findFirst: async ({ where }) => where.cafeId === 'cafe1' ? { cafe: { timezone: 'Africa/Cairo' } } : null } } },
    './config': { walletUpdatesEnabled: () => true },
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

  const next = await lib.sendCampaign({ ...structuredClone(draft), id: 'second', message: 'A new offer' }, eligible);
  assert.equal(next.recipients[0].status, 'accepted');
  assert.equal(pushes, 3);

  const birthday = { ...structuredClone(draft), id: 'birthday', segment: 'birthday_today', recipients: [structuredClone(draft.recipients[0])] };
  assert.equal((await lib.sendCampaign(structuredClone(birthday), eligible)).recipients[0].status, 'accepted');
  assert.equal((await lib.sendCampaign({ ...structuredClone(birthday), id: 'second-birthday' }, eligible)).recipients[0].status, 'skipped');
  assert.equal(pushes, 4);
});

test('an active business can load campaign audiences scoped to its own business', async () => {
  const route = routeFor({ ...admin, cafeId: 'other' }, {
    '@/lib/prisma': { prisma: { cafe: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'other', isActive: true });
      return { id: 'other', name: 'Other business', timezone: 'Africa/Cairo' };
    } } } },
    '@/lib/wallet/campaigns': {
      walletAudience: async (id) => {
        assert.equal(id, 'other');
        return { members: [] };
      },
      campaignHistory: async () => [],
    },
  });
  assert.equal((await route.GET(new NextRequest('https://example.com/api/wallet/campaigns?cafeId=other'))).status, 200);
});

 test('reward-ready audience matches cafe/barber targets and excludes redeemed rewards', async () => {
  const base = {name:'Member',memberNumber:'1',birthday:new Date('2000-01-01'),createdAt:new Date('2020-01-01'),transactions:[],rewardEarnedAt:null};
  const cafe = {businessType:'CAFE',rewardTarget:7};
  const barber = {businessType:'BARBERSHOP',rewardTarget:3};
  const rows = [
    {...base,id:'cafe5',cafe,stamps:5}, {...base,id:'cafe6',cafe,stamps:6},
    {...base,id:'earned',cafe,stamps:0,rewardEarnedAt:new Date()},
    {...base,id:'redeemed',cafe,stamps:0},
    {...base,id:'barber1',cafe:barber,stamps:1}, {...base,id:'barber2',cafe:barber,stamps:2},
  ];
  const lib = loader({ '@/lib/prisma': {prisma:{customer:{findMany:async()=>rows},cafe:{findUnique:async()=>null}}},
    './config': {walletUpdatesEnabled:()=>true},
    './updates':{passKey:id=>id,walletRedis:()=>({pipeline:()=>({hlen(){},exec:async()=>rows.map(()=>1)})})}
  })('lib/wallet/campaigns.ts');
  const audience = await lib.walletAudience('cafe1','Africa/Cairo');
  assert.deepEqual(audience.members.filter(m=>m.segments.includes('reward_ready')).map(m=>m.id),['cafe6','earned','barber2']);
 });
 test('notification text protects progress and uses the configured reward with safe optional text', () => {
  const text = loader()('lib/wallet/notification-text.ts');
  const settings = { stampSuffix: 'Thanks — 100% you!', rewardSuffix: 'Enjoy your treat %@@' };
  assert.equal(text.walletProgressChangeMessage(false, 'Free Cookie', {stampSuffix:'',rewardSuffix:''}), 'Your loyalty progress is now %@.');
  assert.equal(text.walletNotificationPreview('3/6', false, 'Free Cookie', settings), 'Your loyalty progress is now 3/6. Thanks — 100% you!');
  const ready = text.walletProgressChangeMessage(true, 'Free Haircut', settings);
  assert.ok(ready.startsWith('Your loyalty progress is now %@. Your reward is ready: Free Haircut.'));
  assert.ok(ready.includes('%%@@'));
  assert.equal((ready.match(/(?<!%)%@/g)||[]).length, 1);
  assert.ok(!ready.includes('Free drink'));
 });
 test('notification settings reject cashiers, wrong businesses, and attempts to change reward/count fields', async () => {
  let saved = 0;
  function route(auth) { return loader({
    '@/lib/require-auth': {requireAuth: async()=>auth},
    '@/lib/require-active-cafe': {requireActiveCafe: async()=>({allowed:true})},
    '@/lib/wallet/config': {walletUpdatesEnabled:()=>true},
    '@/lib/prisma': {prisma:{cafe:{findFirst:async()=>({rewardName:'Free Cookie',rewardTarget:7,businessType:'CAFE'})}}},
    '@/lib/wallet/notification-settings': {getWalletNotificationSettings:async()=>({stampSuffix:'',rewardSuffix:''}),saveWalletNotificationSettings:async()=>{saved++}},
  })('app/api/wallet/notifications/route.ts'); }
  const studio = { ...admin, isSuperAdmin: true, user: { ...admin.user, role: 'SUPER_ADMIN' } };
  const req = body => new NextRequest('https://example.com/api/wallet/notifications',{method:'POST',headers:{origin:'https://example.com','content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await route({...admin,isCashier:true}).POST(req({cafeId:'cafe1'}))).status,403);
  assert.equal((await route(admin).POST(req({cafeId:'other',stampSuffix:'hi',rewardSuffix:'enjoy'}))).status,403);
  assert.equal((await route(admin).POST(req({cafeId:'cafe1',stampSuffix:'hi',rewardSuffix:'enjoy',stamps:999,rewardName:'Wrong'}))).status,400);
  assert.equal((await route(studio).POST(req({cafeId:'cafe1',stampSuffix:'',rewardSuffix:'',nearbyEnabled:true,nearbyMessage:'Store nearby',nearbyLatitude:null,nearbyLongitude:null}))).status,400);
  assert.equal((await route(studio).POST(req({cafeId:'cafe1',stampSuffix:'',rewardSuffix:'',nearbyEnabled:true,nearbyMessage:'Store nearby',nearbyLatitude:100,nearbyLongitude:29}))).status,400);
  assert.equal(saved,0);
  const response = await route(admin).POST(req({cafeId:'cafe1',stampSuffix:'hi',rewardSuffix:'enjoy'}));
  assert.equal(response.status,200); assert.equal(saved,1);
  const data=await response.json();assert.equal(data.rewardName,'Free Cookie');assert.equal(data.target,6);
 });

 test('start-over message preserves count, supports custom or blank text, and keeps reward readiness priority', () => {
  const text = loader()('lib/wallet/notification-text.ts');
  const settings = {stampSuffix:'Stamp earned!',rewardSuffix:'Enjoy!',resetSuffix:'Here we go again — 100% ready!'};
  assert.equal(text.walletProgressChangeMessage(false,'Free Cookie',settings,true),'Your loyalty progress is now %@. Here we go again — 100%% ready!');
  assert.equal(text.walletNotificationPreview('0/6',false,'Free Cookie',settings),'Your loyalty progress is now 0/6. Here we go again — 100% ready!');
  assert.equal(text.walletProgressChangeMessage(false,'Free Cookie',{...settings,resetSuffix:''},true),'Your loyalty progress is now %@.');
  assert.ok(text.walletProgressChangeMessage(true,'Free Cookie',settings,true).endsWith('Enjoy!'));
  assert.ok(!text.walletProgressChangeMessage(false,'Free Cookie',settings,true).includes('Stamp earned!'));
 });

test('wallet notification settings remain scoped to each business', async (t) => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'mock';
  t.after(() => {
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });
  const lib = loader({
    './campaign-access': { WALLET_CAMPAIGN_PILOT_CAFE_ID: 'pilot' },
    './updates': { passKey: id => id, walletRedis: () => ({
      get: async key => key.endsWith(':other')
        ? { stampSuffix: 'Our original thank-you', rewardSuffix: 'Our original reward note' }
        : null,
    }) },
  })('lib/wallet/notification-settings.ts');
  const settings = await lib.getWalletNotificationSettings('other');
  assert.equal(settings.stampSuffix, 'Our original thank-you');
  assert.equal(settings.rewardSuffix, 'Our original reward note');
  assert.equal(settings.resetSuffix, 'A fresh start towards your next reward ✨');
  assert.equal(await lib.getWalletNotificationSettings('unconfigured'), undefined);
  assert.equal((await lib.getWalletNotificationSettings('pilot')).resetSuffix, settings.resetSuffix);
});
