import { expect, test } from "vite-plus/test";
import { renderAcknowledgement } from "./templates";
import { routeRequests } from "./routing";
import { samples } from "./samples";
import type { Extraction, TaskAttempt } from "./contracts";

const task = routeRequests(samples[0], {
  language: "en",
  requests: [
    {
      type: "towels",
      details: "Two towels",
      sourceText: "two towels",
      room: "204",
      roomSourceText: "Room 204",
      roomStatus: "known",
    },
  ],
})[0];
const created: TaskAttempt = { task, status: "created", taskId: "test" };
test.each([
  ["en", "We have passed", "towels"],
  ["fil", "Naipasa namin", "tuwalya"],
  ["ceb", "Gipasa namo", "tualya"],
  ["mixed", "We have passed", "towels"],
  ["unsupported", "We have passed", "towels"],
  ["unknown", "We have passed", "towels"],
] as const)("template language %s", (language, prefix, label) => {
  const reply = renderAcknowledgement(language, [created]);
  expect(reply).toContain(prefix);
  expect(reply).toContain(label);
  expect(reply).not.toMatch(/approved|delivered/);
});

test.each(["en", "fil", "ceb"] as Extraction["language"][])(
  "clarification survives failed review without false confirmation in %s",
  (language) => {
    const failed: TaskAttempt = {
      task: {
        ...task,
        room: null,
        department: "front_desk",
        needsReview: true,
        reviewReason: "missing_room",
      },
      status: "failed",
      error: "failed",
    };
    const text = renderAcknowledgement(language, [failed]);
    expect(text).not.toMatch(/We have passed|Naipasa namin|Gipasa namo/);
    expect(text).toMatch(/Please provide|Pakibigay|Palihog ihatag/);
    expect(text).toMatch(/could not record|Hindi namin naitala|Wala namo marekord/);
  },
);

test("partial success distinguishes recorded, review, and failed work", () => {
  const review: TaskAttempt = {
    task: {
      ...task,
      type: "unknown",
      department: "front_desk",
      needsReview: true,
      reviewReason: "unknown_request",
    },
    status: "created",
    taskId: "review",
  };
  const failed: TaskAttempt = {
    task: { ...task, type: "tour", department: "concierge" },
    status: "failed",
    error: "failed",
  };
  const reply = renderAcknowledgement("en", [created, review, failed]);
  expect(reply).toContain("front desk for review");
  expect(reply).toContain("could not record these requests: tour");
  expect(reply).not.toContain("clarify the room");
});
