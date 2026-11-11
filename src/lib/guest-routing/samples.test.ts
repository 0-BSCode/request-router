import { expect, test } from "vite-plus/test";
import { samples } from "./samples";

test("every documented sample parses and has a unique ID and expected outcome", () => {
  expect(samples).toHaveLength(13);
  expect(new Set(samples.map((sample) => sample.messageId)).size).toBe(samples.length);
  expect(samples.every((sample) => sample.expected.length > 20)).toBe(true);
});
