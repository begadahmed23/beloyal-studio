const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function load(file, imports = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  new Function('exports', 'require', outputText)(exports, id => imports[id] ?? require(id));
  return exports;
}

test('analytics counts monthly loyalty redemptions for the authenticated business and preserves custom reward names', async () => {
  const terminology = load('lib/business/terminology.ts');
  const cafe = { id: 'business-1', businessType: 'VAPE', rewardName: '50%', rewardTarget: 7, timezone: 'Africa/Cairo' };
  const { GET } = load('app/api/analytics/route.ts', {
    '@/lib/business/terminology': terminology,
    '@/lib/require-auth': { requireAuth: async () => ({ cafe, isCashier: false }) },
    '@/lib/prisma': {
      prisma: {
        customer: { count: async () => 2 },
        stampTransaction: {
          groupBy: async () => [{ customerId: 'member-1' }],
          count: async ({ where }) => {
            assert.equal(where.cafeId, cafe.id);
            assert.equal(where.type, 'REDEEM');
            assert.ok(where.createdAt.gte < where.createdAt.lt);
            return 3;
          },
        },
        customerReview: {
          aggregate: async () => ({ _avg: { rating: null }, _count: { rating: 0 } }),
          groupBy: async () => [],
          findMany: async () => [],
        },
        customerFeedback: { findMany: async () => [] },
      },
    },
  });

  for (const [businessType, savedReward, expectedReward] of [
    ['VAPE', '50%', '50%'],
    ['VAPE', 'Free Drink', 'Member Reward'],
    ['BARBERSHOP', 'free drink', 'Free Haircut'],
    ['OTHER', '', 'Member Reward'],
    ['CAFE', 'Free Drink', 'Free Drink'],
  ]) {
    Object.assign(cafe, { businessType, rewardName: savedReward });
    const response = await GET(new NextRequest('https://example.com/api/analytics'));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.rewardsRedeemedThisMonth, 3);
    assert.equal(data.freeDrinksThisMonth, 3);
    assert.equal(data.rewardName, expectedReward);
  }
});
