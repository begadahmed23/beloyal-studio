/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");

function load(filename) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("exports", "require", source)(exports, require);
  return exports;
}

const points = load("lib/business/points.ts");
const themes = load("lib/cafe-theme.ts");
const { loyaltyScanValue, parseLoyaltyScan } = load("lib/business/loyalty-scan.ts");

test("point earnings retain fractions and handle whole group bills", () => {
  for (const [amount, expected] of [["100", "10"], ["150", "15"], ["350", "35"], ["1099", "109.9"], ["9000000000", "900000000"]]) {
    assert.equal(points.earnedPoints(amount, "10"), expected);
  }
  assert.equal(points.normalizePointsInput("١٠٩٩٫٩٩"), "1099.99");
  assert.equal(points.earnedPoints("0.01", "0.005"), "0.000001");
  assert.equal(points.earnedPoints("0.01", "0.0049"), "0");
  for (const invalid of ["0", "-1", "1e4", "150.003"]) assert.equal(points.purchaseAmountSchema.safeParse(invalid).success, false);
});

test("the subscription quotes use the same per-store rate in either period", () => {
  assert.deepEqual([1, 2, 3].map(count => points.branchQuote(count, "MONTHLY")), [700, 1400, 2100]);
  assert.deepEqual([1, 2, 3].map(count => points.branchQuote(count, "YEARLY")), [7000, 14000, 21000]);
});

test("both Red & Orange variants are available to restaurants", () => {
  assert.equal(themes.getDefaultBusinessTheme("RESTAURANT"), "RED_ORANGE_LIGHT");
  assert.deepEqual(themes.getBusinessThemeColors("RED_ORANGE_DARK", "RESTAURANT"), ["#e1a184", "#edb198", "#181716"]);
  assert.equal(themes.getDashboardTheme("RED_ORANGE_DARK", { primaryColor: "#ff651e", secondaryColor: "#ff864d", backgroundColor: "#171717" }).surface, "#22201f");
  assert.notEqual(themes.getBusinessTheme("RED_ORANGE_DARK", "CAFE").pageBackground, "#171717");
});

test("Firey Nash Studio names resolve to the existing branding and branch links", () => {
  for (const name of ["Firey Nash", "FieryNash", "firynash"]) assert.equal(points.isFireyNashName(name), true);
  assert.equal(points.isFireyNashName("Firey Nash Cafe"), false);
  assert.equal(points.fireyNashBrand.slug, "firey-nash");
  assert.deepEqual(points.fireyNashBrand.branches.map(branch => branch.id),
    ["fireynashsidigaber", "fireynashelna2al"]);
  assert.deepEqual(points.fireyNashBrand.branches.map(branch => branch.name), ["سيدي جابر", "النقل والهندسة"]);
});

test("member and reward QR payloads use compatible scanner formats", () => {
  const token = "ab1234".repeat(8);
  assert.deepEqual(parseLoyaltyScan(loyaltyScanValue(token)), { token, rewardId: null });
  assert.deepEqual(parseLoyaltyScan("  " + loyaltyScanValue(token, "reward-123") + "\r\n"),
    { token, rewardId: "reward-123" });
  for (const invalid of [`BLR:${token}`, `BLR:${token}:reward:extra`, `BLR:${token}:../reward`, "BL:123"]) {
    assert.equal(parseLoyaltyScan(invalid), null);
  }
});
