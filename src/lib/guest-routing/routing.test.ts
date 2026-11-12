import { afterEach, expect, test, vi } from "vite-plus/test";
import { extractionSchema, type ExtractedRequest, type Extraction } from "./contracts";
import { extractRequests } from "./extract.server";
import { routeRequests } from "./routing";
import { samples } from "./samples";

afterEach(() => vi.unstubAllGlobals());
const cases: [
  string,
  Extraction["detectedLanguage"],
  [ExtractedRequest["type"], string | null, string][],
][] = [
  ["towels-en", "en", [["towels", "204", "Two towels"]]],
  ["checkout-fil", "fil", [["late_checkout", "204", "Late checkout at 2 PM"]]],
  ["tour-ceb", "ceb", [["tour", "305", "Island tour tomorrow"]]],
  ["complaint-en", "en", [["complaint", "A204", "Noisy neighbors"]]],
  [
    "multi-en",
    "en",
    [
      ["towels", "204", "Two towels"],
      ["late_checkout", "204", "Late checkout at 2 PM"],
    ],
  ],
  [
    "mixed",
    "mixed",
    [
      ["towels", "204", "Two towels"],
      ["tour", "204", "Tour tomorrow"],
    ],
  ],
  [
    "unknown",
    "en",
    [
      ["towels", "204", "Towels"],
      ["unknown", "204", "Laptop repair"],
    ],
  ],
  ["missing", "en", [["towels", null, "Towels"]]],
  ["ambiguous", "en", [["towels", null, "Towels"]]],
  [
    "separate-rooms",
    "en",
    [
      ["towels", "204", "Towels"],
      ["tour", "305", "Island tour tomorrow"],
    ],
  ],
  [
    "same-department",
    "en",
    [
      ["late_checkout", "204", "Late checkout at 2 PM"],
      ["complaint", "204", "Noisy neighbors"],
    ],
  ],
  ["repeat", "en", [["towels", "204", "Two towels"]]],
  ["unsupported", "fr", []],
];

test.each(cases)(
  "validates representative extraction and routes fixture %s",
  async (id, detectedLanguage, items) => {
    const sample = samples.find((s) => s.messageId === id)!;
    const requests = items.map(([type, room, details]) => ({
      type,
      room,
      details,
      sourceText: sample.text,
      roomSourceText: room || id === "ambiguous" ? sample.text : null,
      roomStatus: room ? "known" : id === "ambiguous" ? "ambiguous" : "missing",
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify({ detectedLanguage, requests }) },
            },
          ],
        }),
      ),
    );
    const extracted = await extractRequests(sample.text, { key: "test", model: "test" });
    expect(extracted.detectedLanguage).toBe(detectedLanguage);
    const tasks = routeRequests(sample, extracted);
    expect(tasks.every((task) => task.detectedLanguage === detectedLanguage)).toBe(true);
    expect(tasks.map((t) => t.department)).toEqual(
      id === "unsupported"
        ? ["front_desk"]
        : items.map(([type, room]) =>
            !room || (type !== "towels" && type !== "tour")
              ? "front_desk"
              : type === "towels"
                ? "housekeeping"
                : "concierge",
          ),
    );
    expect(tasks.map((t) => t.room)).toEqual(
      id === "unsupported" ? [null] : items.map(([, room]) => room),
    );
    expect(tasks.every((t) => t.originalMessage === sample.text && t.messageId === id)).toBe(true);
    if (id === "unknown") expect(tasks[1].reviewReason).toBe("unknown_request");
    if (id === "missing") expect(tasks[0].reviewReason).toBe("missing_room");
    if (id === "ambiguous") expect(tasks[0].reviewReason).toBe("ambiguous_room");
    if (id === "multi-en")
      expect(tasks.map((t) => t.details)).toEqual(["Two towels", "Late checkout at 2 PM"]);
  },
);

test.each([
  [null, "extraction_failure"],
  [{ detectedLanguage: "fr", requests: [] }, "unsupported_language"],
  [{ detectedLanguage: "unknown", requests: [] }, "uncertain_language"],
  [{ detectedLanguage: "en", requests: [] }, "no_actionable_request"],
] as const)("whole-message review retains source and reason", (value, reason) => {
  const extraction = value ? extractionSchema.parse(value) : null;
  const tasks = routeRequests(samples[0], extraction);
  expect(tasks[0].details).toMatch(/^Review the guest message\./);
  expect(tasks[0].details).not.toBe(samples[0].text);
  expect(tasks[0].detectedLanguage).toBe(extraction?.detectedLanguage ?? "unknown");
  expect(tasks).toMatchObject([
    {
      department: "front_desk",
      needsReview: true,
      room: null,
      reviewReason: reason,
      originalMessage: samples[0].text,
    },
  ]);
});
