import { expect, test, vi } from "vite-plus/test";
import {
  detectedLanguageSchema,
  getReplyLanguage,
  isSupportedLanguage,
  getLanguageLabel,
  getLanguageSupportLabel,
} from "./languages";

test.each([
  ["en", true, "en"],
  ["fil", true, "fil"],
  ["ceb", true, "ceb"],
  ["mixed", true, "en"],
  ["fr", false, "en"],
  ["unknown", false, "en"],
] as const)("derives support and reply language for %s", (code, supported, reply) => {
  expect(detectedLanguageSchema.parse(code)).toBe(code);
  expect(isSupportedLanguage(code)).toBe(supported);
  expect(getReplyLanguage(code)).toBe(reply);
});

test.each([undefined, "", "French", "unsupported", "en-US", "EN", "<script>"])(
  "rejects invalid language metadata %s",
  (value) => {
    expect(detectedLanguageSchema.safeParse(value).success).toBe(false);
  },
);

test.each([
  ["en", "English", "Supported"],
  ["fil", "Filipino", "Supported"],
  ["ceb", "Cebuano", "Supported"],
  ["fr", "French", "Unsupported"],
  ["mixed", "Mixed supported languages", "English reply"],
  ["unknown", "Unknown", "Review required"],
] as const)("renders detected language %s with derived support", (code, name, support) => {
  expect(getLanguageLabel(code)).toBe(name);
  expect(getLanguageSupportLabel(code)).toBe(support);
});

test("uses the raw code if the platform has no language name", () => {
  const lookup = vi.spyOn(Intl.DisplayNames.prototype, "of").mockReturnValue(undefined);
  try {
    expect(getLanguageLabel("zzz")).toBe("zzz");
  } finally {
    lookup.mockRestore();
  }
});
