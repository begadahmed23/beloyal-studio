const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");

const validation = {};
const source = ts.transpileModule(readFileSync("app/api/cafe/settings/validation.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function("exports", "require", source)(validation, require);

test("a section validates and returns only the fields it owns", () => {
  const validate = validation.validateCafeSettingsPatch;
  assert.deepEqual(validate({ section: "general", name: "  Sample shop ", logoUrl: "", rewardName: "unsaved" }),
    { name: "Sample shop", logoUrl: null });
  assert.deepEqual(validate({ section: "branding", theme: "DARK_LUXURY", name: "unsaved", googleReviewUrl: "invalid" }),
    { theme: "DARK_LUXURY" });
  assert.deepEqual(validate({ section: "loyalty", rewardTarget: "7", rewardName: "50% off", minimumPurchaseAmount: "150", feedbackEnabled: true }),
    { rewardTarget: 7, rewardName: "50% off", rewardDescription: null, eligiblePurchaseDescription: null, minimumPurchaseAmount: 150 });
  assert.deepEqual(validate({ section: "feedback", feedbackEnabled: false, feedbackRewardEnabled: false }),
    { feedbackEnabled: false, feedbackRewardEnabled: false });
  assert.deepEqual(validate({ section: "reviews", googleReviewUrl: "" }), { googleReviewUrl: null });
  assert.throws(() => validate({ section: "loyalty", rewardTarget: "invalid", rewardName: "Test" }), /whole number/);
  assert.throws(() => validate({ section: "constructor" }), /Invalid settings section/);
});

test("cached clients can still submit the previously supported full payload", () => {
  const settings = validation.validateCafeSettingsPatch({
    name: "Sample shop", theme: "COFFEE_CLASSIC", rewardTarget: 7, rewardName: "Test reward",
    primaryColor: "#6a4937", feedbackEnabled: false, googleReviewUrl: "https://example.com/review",
  });
  assert.equal(settings.name, "Sample shop");
  assert.equal(settings.rewardTarget, 7);
  assert.equal(settings.primaryColor, "#6a4937");
  assert.equal(settings.feedbackEnabled, false);
  assert.equal(settings.googleReviewUrl, "https://example.com/review");
  assert.equal(Object.hasOwn(settings, "birthdayRewardsEnabled"), false);
});

test("saving dashboard branding leaves the customer card palette intact", () => {
  function load(path, resolve = require) {
    const exports = {};
    const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    new Function("exports", "require", outputText)(exports, resolve);
    return exports;
  }

  const mbVape = load("lib/business/mb-vape.ts");
  const { dashboardPaletteUpdate, getDashboardPalette } = load(
    "lib/business/dashboard-palette.ts",
    (id) => id === "./mb-vape" ? mbVape : require(id),
  );
  const savedBusiness = {
    slug: "sample-cafe", businessType: "CAFE",
    theme: "COFFEE_CLASSIC", primaryColor: "#7b4f35", secondaryColor: "#6f4a35", backgroundColor: "#f3ede5",
    dashboardTheme: null, dashboardPrimaryColor: null, dashboardSecondaryColor: null, dashboardBackgroundColor: null,
  };
  assert.equal(getDashboardPalette(savedBusiness).hasDashboardPalette, false);

  const paletteChange = dashboardPaletteUpdate({ theme: "DARK_LUXURY", primaryColor: "#debb93" });
  assert.deepEqual(paletteChange, { dashboardTheme: "DARK_LUXURY", dashboardPrimaryColor: "#debb93" });

  const updatedBusiness = { ...savedBusiness, ...paletteChange };
  assert.equal(updatedBusiness.theme, savedBusiness.theme);
  assert.equal(updatedBusiness.primaryColor, savedBusiness.primaryColor);
  assert.equal(getDashboardPalette(updatedBusiness).theme, "DARK_LUXURY");
  assert.equal(getDashboardPalette(updatedBusiness).primaryColor, "#debb93");
  assert.equal(getDashboardPalette(updatedBusiness).secondaryColor, savedBusiness.secondaryColor);
});
