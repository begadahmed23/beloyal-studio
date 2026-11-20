const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");
const { NextRequest } = require("next/server");

const { outputText } = ts.transpileModule(readFileSync("app/api/join/[slug]/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

test("new members record a valid signup store and existing cards keep their source", async () => {
  const member = { id: "member", publicToken: "token", phone: "01012345678" };
  const locations = new Map([["mb:zeitoun", { id: "zeitoun" }], ["other:foreign", { id: "foreign" }]]);
  const creates = [];
  let existing = null;
  let locationLookups = 0;
  const prisma = {
    cafe: { findUnique: async () => ({ id: "mb", isActive: true }) },
    cafeLocation: { findUnique: async ({ where }) => {
      locationLookups++;
      const { cafeId, id } = where.cafeId_id;
      return locations.get(`${cafeId}:${id}`) ?? null;
    } },
    customer: {
      findFirst: async () => existing,
      create: async ({ data }) => { creates.push(data); return member; },
    },
  };
  const route = {};
  new Function("exports", "require", outputText)(route, id => {
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

  existing = member;
  assert.equal((await join("zeitoun")).status, 200);
  assert.equal((await join("zeitoun", "recover")).status, 200);
  assert.equal(creates.length, 3);
  assert.equal(locationLookups, 2);
});
