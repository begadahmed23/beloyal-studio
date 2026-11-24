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
  assert.deepEqual(themes.getBusinessThemeColors("RED_ORANGE_DARK", "RESTAURANT"), ["#ff651e", "#ff864d", "#171717"]);
  assert.notEqual(themes.getBusinessTheme("RED_ORANGE_DARK", "CAFE").pageBackground, "#171717");
});
