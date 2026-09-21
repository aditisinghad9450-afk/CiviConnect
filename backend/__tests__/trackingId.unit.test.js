const { generateTrackingId, ALPHABET } = require("../utils/trackingId");

describe("generateTrackingId", () => {
  test("matches the CC-<year>-<8 chars> format", () => {
    const id = generateTrackingId(new Date("2026-05-01T00:00:00Z"));
    expect(id).toMatch(/^CC-2026-[A-Z2-9]{8}$/);
  });

  test("uses the current year by default", () => {
    const year = new Date().getFullYear();
    expect(generateTrackingId().startsWith(`CC-${year}-`)).toBe(true);
  });

  test("excludes ambiguous characters (0, O, 1, I, L)", () => {
    for (const bad of ["0", "O", "1", "I", "L"]) expect(ALPHABET).not.toContain(bad);
    const suffixes = Array.from({ length: 200 }, () => generateTrackingId().split("-")[2]).join("");
    expect(suffixes).not.toMatch(/[01OIL]/);
  });

  test("generates unique IDs across many calls", () => {
    const ids = new Set(Array.from({ length: 5000 }, () => generateTrackingId()));
    expect(ids.size).toBe(5000);
  });
});