import { getReplyLanguage } from "./languages";
import type { TaskAttempt } from "./contracts";

const templates = {
  en: {
    requests: {
      towels: "your towel request",
      late_checkout: "your late checkout request",
      complaint: "your concern",
      tour: "your tour request",
      unknown: "your message",
    },
    destinations: {
      towels: "to housekeeping",
      late_checkout: "to the front desk for review",
      complaint: "to the front desk",
      tour: "to concierge",
    },
    room: (room: string) => ` for room ${room}`,
    forwarded: (request: string, destination: string) => `We've passed ${request} ${destination}.`,
    review: (request: string) => `We've passed ${request} to the front desk for review.`,
    failed: (request: string) => `We couldn't pass on ${request}.`,
    clarify: "Which room is this request for?",
    help: "Please contact the front desk for help with any request we couldn't pass on.",
  },
  fil: {
    requests: {
      towels: "ang inyong kahilingan para sa mga tuwalya",
      late_checkout: "ang inyong kahilingan para sa late checkout",
      complaint: "ang inyong reklamo",
      tour: "ang inyong kahilingan para sa tour",
      unknown: "ang inyong mensahe",
    },
    destinations: {
      towels: "sa housekeeping",
      late_checkout: "sa front desk upang masuri",
      complaint: "sa front desk",
      tour: "sa concierge",
    },
    room: (room: string) => ` sa kuwarto ${room}`,
    forwarded: (request: string, destination: string) =>
      `Naipasa na namin ${request} ${destination}.`,
    review: (request: string) => `Naipasa na namin ${request} sa front desk upang masuri.`,
    failed: (request: string) => `Hindi namin naipasa ${request}.`,
    clarify: "Para sa aling kuwarto ang kahilingang ito?",
    help: "Mangyaring makipag-ugnayan sa front desk para sa tulong sa mga kahilingang hindi namin naipasa.",
  },
  ceb: {
    requests: {
      towels: "ang inyong hangyo alang sa mga tualya",
      late_checkout: "ang inyong hangyo alang sa late checkout",
      complaint: "ang inyong reklamo",
      tour: "ang inyong hangyo alang sa tour",
      unknown: "ang inyong mensahe",
    },
    destinations: {
      towels: "sa housekeeping",
      late_checkout: "sa front desk aron susihon",
      complaint: "sa front desk",
      tour: "sa concierge",
    },
    room: (room: string) => ` sa kwarto ${room}`,
    forwarded: (request: string, destination: string) =>
      `Gipasa na namo ${request} ${destination}.`,
    review: (request: string) => `Gipasa na namo ${request} sa front desk aron susihon.`,
    failed: (request: string) => `Wala namo mapasa ${request}.`,
    clarify: "Para sa unsang kwarto kining hangyo?",
    help: "Palihog kontaka ang front desk aron matabangan kamo sa mga hangyo nga wala namo mapasa.",
  },
};

export function renderAcknowledgement(detectedLanguage: string, attempts: TaskAttempt[]) {
  const words = templates[getReplyLanguage(detectedLanguage)];
  const paragraphs = attempts.map(({ task, status }) => {
    const request = words.requests[task.type] + (task.room ? words.room(task.room) : "");
    const sentence =
      status === "failed"
        ? words.failed(request)
        : task.needsReview || task.type === "unknown"
          ? words.review(request)
          : words.forwarded(request, words.destinations[task.type]);
    return task.reviewReason === "missing_room" || task.reviewReason === "ambiguous_room"
      ? `${sentence} ${words.clarify}`
      : sentence;
  });
  if (attempts.some((attempt) => attempt.status === "failed")) paragraphs.push(words.help);
  return paragraphs.join("\n\n");
}
