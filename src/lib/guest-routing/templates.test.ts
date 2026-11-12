import { expect, test } from "vite-plus/test";
import { renderAcknowledgement } from "./templates";
import { routeRequests } from "./routing";
import { samples } from "./samples";
import type { TaskAttempt } from "./contracts";

const task = routeRequests(samples[0], {
  detectedLanguage: "en",
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
  ["en", "We've passed", "your towel request"],
  ["fil", "Naipasa na namin", "tuwalya"],
  ["ceb", "Gipasa na namo", "tualya"],
  ["mixed", "We've passed", "your towel request"],
  ["fr", "We've passed", "your towel request"],
  ["unknown", "We've passed", "your towel request"],
] as const)("uses readable sentences for %s", (code, prefix, label) => {
  const reply = renderAcknowledgement(code, [created]);
  expect(reply).toContain(prefix);
  expect(reply).toContain(label);
  expect(reply).toContain("204");
  expect(reply).not.toMatch(/[[\]();]|approved|delivered/);
});

test.each(["en", "fil", "ceb"])(
  "covers each known request type and generic review in %s",
  (code) => {
    for (const type of ["towels", "late_checkout", "complaint", "tour", "unknown"] as const) {
      const attempt: TaskAttempt = {
        ...created,
        task: {
          ...task,
          type,
          department:
            type === "tour" ? "concierge" : type === "towels" ? "housekeeping" : "front_desk",
          needsReview: type === "unknown",
          reviewReason: type === "unknown" ? "unknown_request" : null,
        },
      };
      const reply = renderAcknowledgement(code, [attempt]);
      expect(reply).toMatch(/^(We've passed|Naipasa na namin|Gipasa na namo)/);
      expect(reply).not.toMatch(/unknown_request|other request|\[204\]|\(front desk\)/);
    }
  },
);

test.each([
  ["en", "Which room is this request for?", "We couldn't pass on"],
  ["fil", "Para sa aling kuwarto ang kahilingang ito?", "Hindi namin naipasa"],
  ["ceb", "Para sa unsang kwarto kining hangyo?", "Wala namo mapasa"],
] as const)(
  "asks a direct room question even when review fails in %s",
  (code, question, failedText) => {
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
    const text = renderAcknowledgement(code, [failed]);
    expect(text).toContain(failedText);
    expect(text).toContain(question);
    expect(text).not.toMatch(/We've passed|Naipasa na namin|Gipasa na namo/);
    expect(text).toContain("front desk");
  },
);

test("preserves request order, correct rooms, and separate outcomes", () => {
  const failed: TaskAttempt = {
    task: { ...task, type: "late_checkout", room: "305", department: "front_desk" },
    status: "failed",
    error: "failed",
  };
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
  expect(renderAcknowledgement("en", [failed, created, review])).toBe(
    "We couldn't pass on your late checkout request for room 305.\n\nWe've passed your towel request for room 204 to housekeeping.\n\nWe've passed your message for room 204 to the front desk for review.\n\nPlease contact the front desk for help with any request we couldn't pass on.",
  );
});

test("only the unresolved request gets the clarification question", () => {
  const unresolved: TaskAttempt = {
    ...created,
    task: {
      ...task,
      type: "late_checkout",
      room: null,
      department: "front_desk",
      needsReview: true,
      reviewReason: "ambiguous_room",
    },
  };
  const paragraphs = renderAcknowledgement("en", [created, unresolved]).split("\n\n");
  expect(paragraphs[0]).toBe("We've passed your towel request for room 204 to housekeeping.");
  expect(paragraphs[1]).toBe(
    "We've passed your late checkout request to the front desk for review. Which room is this request for?",
  );
});

test.each(["fil", "ceb"])(
  "does not insert arbitrary English details or original text in %s replies",
  (code) => {
    const reply = renderAcknowledgement(code, [
      {
        ...created,
        task: {
          ...task,
          details: "SECRET SUMMARY NOT FOR GUEST",
          sourceText: "SECRET SOURCE NOT FOR GUEST",
        },
      },
    ]);
    expect(reply).not.toContain("SECRET");
  },
);

test("Filipino room wording avoids repeating para sa", () => {
  expect(renderAcknowledgement("fil", [created])).toBe(
    "Naipasa na namin ang inyong kahilingan para sa mga tuwalya sa kuwarto 204 sa housekeeping.",
  );
});
