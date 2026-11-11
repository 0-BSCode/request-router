import { afterEach, expect, test, vi } from "vite-plus/test";

import { getInitialOwnerPassword, getOwnerEmail, isOwner } from "./owner";

afterEach(() => vi.unstubAllEnvs());

test("normalizes owner identity and denies other or missing identities", () => {
  vi.stubEnv("OWNER_EMAIL", " Owner@Example.com ");
  expect(getOwnerEmail()).toBe("owner@example.com");
  expect(isOwner({ email: "OWNER@example.com" })).toBe(true);
  expect(isOwner({ email: "other@example.com" })).toBe(false);
  expect(isOwner(null)).toBe(false);
});

test("missing or invalid configuration fails closed without echoing input", () => {
  for (const email of [
    undefined,
    "",
    "not-a-valid-email",
    '"reviewer@example.com',
    'reviewer@example.com"',
    '"not-an-email"',
  ]) {
    vi.stubEnv("OWNER_EMAIL", email);
    expect(() => getOwnerEmail()).toThrow("Set OWNER_EMAIL to a valid email address.");
    expect(isOwner({ email: "owner@example.com" })).toBe(false);
  }
});

test("preserves the exact initial password and accepts both length boundaries", () => {
  for (const password of ["a".repeat(8), "a".repeat(128), "  $a='b=c'  "]) {
    vi.stubEnv("OWNER_PASSWORD", password);
    expect(getInitialOwnerPassword()).toBe(password);
  }
  for (const password of [undefined, "", "a".repeat(7), "a".repeat(129)]) {
    vi.stubEnv("OWNER_PASSWORD", password);
    expect(() => getInitialOwnerPassword()).toThrow(
      "Set OWNER_PASSWORD to an initial password of 8 to 128 characters.",
    );
  }
});
