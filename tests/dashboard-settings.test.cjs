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
