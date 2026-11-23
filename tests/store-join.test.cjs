const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");
const { NextRequest } = require("next/server");

function compileRoute(filename) {
  return ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

test("new members record a valid signup store and existing cards keep their source", async () => {
  const member = { id: "member", publicToken: "token", phone: "01012345678" };
  const locations = new Map([
    ["mb:zeitoun", { id: "zeitoun", archivedAt: null }],
    ["mb:oldbranch", { id: "oldbranch", archivedAt: new Date() }],
    ["other:foreign", { id: "foreign", archivedAt: null }],
  ]);
  const creates = [];
  let existing = null;
  let locationLookups = 0;
  const prisma = {
    cafe: { findUnique: async () => ({ id: "mb", isActive: true }) },
    cafeLocation: { findUnique: async ({ where }) => {
      locationLookups++;
      const { cafeId, id } = where.cafeId_id;
      const location = locations.get(`${cafeId}:${id}`);
      return location?.archivedAt === where.archivedAt ? location : null;
    } },
    customer: {
      findFirst: async () => existing,
      create: async ({ data }) => { creates.push(data); return member; },
    },
  };
  const route = {};
  new Function("exports", "require", compileRoute("app/api/join/[slug]/route.ts"))(route, id => {
    if (id === "@/lib/prisma") return { prisma };
    if (id === "@/lib/public-api-security") {
      return { applyPublicRateLimit: async () => null, publicApiRateLimiters: {} };
    }
    return require(id);
  });

  const join = (locationId, action = "join") => route.POST(new NextRequest("https://example.com/api/join/mb-vape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, locationId, name: "New Member", phone: member.phone,
      birthday: "2000-01-01", privacyAccepted: true, marketingConsent: true }),
  }), { params: Promise.resolve({ slug: "mb-vape" }) });

  assert.equal((await join("zeitoun")).status, 201);
  assert.equal(creates[0].joinLocationId, "zeitoun");
  assert.equal((await join("foreign")).status, 201);
  assert.equal(creates[1].joinLocationId, undefined);
  assert.equal((await join(undefined)).status, 201);
  assert.equal(creates[2].joinLocationId, undefined);
  assert.equal((await join("oldbranch")).status, 201);
  assert.equal(creates[3].joinLocationId, undefined);

  existing = member;
  assert.equal((await join("zeitoun")).status, 200);
  assert.equal((await join("zeitoun", "recover")).status, 200);
  assert.equal(creates.length, 4);
  assert.equal(locationLookups, 3);
});

test("only the owning business admin can remove a store, and adding its name restores it", async () => {
  const store = { id: "greenplaza", cafeId: "gourmeal", name: "Green Plaza", archivedAt: null };
  let cafeId = "other";
  let role = "CAFE_ADMIN";
  const route = {};
  new Function("exports", "require", compileRoute("app/api/cafe/locations/route.ts"))(route, id => {
    if (id === "@/lib/require-active-cafe") {
      return { requireActiveCafe: async () => ({ allowed: true, authData: { cafeId, user: { role } } }) };
    }
    if (id !== "@/lib/prisma") return require(id);
    return { prisma: { cafeLocation: {
      updateMany: async ({ where, data }) => {
        if (store.id !== where.id || store.cafeId !== where.cafeId || store.archivedAt !== where.archivedAt) return { count: 0 };
        store.archivedAt = data.archivedAt;
        return { count: 1 };
      },
      upsert: async ({ where, update }) => {
        assert.deepEqual(where, { cafeId_name: { cafeId: "gourmeal", name: "Green Plaza" } });
        store.archivedAt = update.archivedAt;
        return { id: store.id, name: store.name };
      },
    } } };
  });
  const change = (method, body) => route[method](new NextRequest("https://example.com/api/cafe/locations", {
    method, headers: { "Content-Type": "application/json", origin: "https://example.com" }, body: JSON.stringify(body),
  }));
  assert.equal((await change("DELETE", { id: store.id })).status, 404);
  assert.equal(store.archivedAt, null);
  cafeId = "gourmeal";
  role = "CASHIER";
  assert.equal((await change("DELETE", { id: store.id })).status, 403);
  role = "CAFE_ADMIN";
  assert.equal((await change("DELETE", { id: store.id })).status, 204);
  assert.ok(store.archivedAt instanceof Date);
  const restored = await change("POST", { name: "Green  Plaza" });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).location.id, store.id);
  assert.equal(store.archivedAt, null);
});
