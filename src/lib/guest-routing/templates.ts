import type { Extraction, TaskAttempt } from "./contracts";

const templates = {
  en: {
    recorded: "We have passed these requests to the relevant teams:",
    review: "We have passed these requests to front desk for review:",
    failed: "We could not record these requests:",
    clarify: "Please provide or clarify the room for the requests that have no confirmed room.",
    types: {
      towels: "towels",
      late_checkout: "late checkout",
      complaint: "complaint",
      tour: "tour",
      unknown: "other request",
    },
    departments: { housekeeping: "housekeeping", front_desk: "front desk", concierge: "concierge" },
  },
  fil: {
    recorded: "Naipasa namin ang mga kahilingang ito sa mga kaukulang departamento:",
    review: "Naipasa namin ang mga kahilingang ito sa front desk para suriin:",
    failed: "Hindi namin naitala ang mga kahilingang ito:",
    clarify:
      "Pakibigay o pakilinaw ang kuwarto para sa mga kahilingang walang kumpirmadong kuwarto.",
    types: {
      towels: "mga tuwalya",
      late_checkout: "pagpapaliban ng checkout",
      complaint: "reklamo",
      tour: "paglilibot",
      unknown: "ibang kahilingan",
    },
    departments: {
      housekeeping: "tagapangasiwa ng mga kuwarto",
      front_desk: "tanggapan ng mga bisita",
      concierge: "tagapag-ayos ng paglilibot",
    },
  },
  ceb: {
    recorded: "Gipasa namo kining mga hangyo sa hingtungdang mga departamento:",
    review: "Gipasa namo kining mga hangyo sa front desk aron susihon:",
    failed: "Wala namo marekord kining mga hangyo:",
    clarify:
      "Palihog ihatag o klaroha ang kwarto para sa mga hangyo nga walay kumpirmadong kwarto.",
    types: {
      towels: "mga tualya",
      late_checkout: "ulahing checkout",
      complaint: "reklamo",
      tour: "paglibot",
      unknown: "ubang hangyo",
    },
    departments: {
      housekeeping: "tig-atiman sa mga kwarto",
      front_desk: "dawatang lamesa",
      concierge: "tig-organisar sa paglibot",
    },
  },
};

export function renderAcknowledgement(language: Extraction["language"], attempts: TaskAttempt[]) {
  const words = templates[language === "fil" || language === "ceb" ? language : "en"];
  const describe = ({ task }: TaskAttempt) =>
    `${words.types[task.type]}${task.room ? ` [${task.room}]` : ""} (${words.departments[task.department]})`;
  const clauses: string[] = [];
  const recorded = attempts.filter((item) => item.status === "created" && !item.task.needsReview);
  const review = attempts.filter((item) => item.status === "created" && item.task.needsReview);
  const failed = attempts.filter((item) => item.status === "failed");
  for (const [items, prefix] of [
    [recorded, words.recorded],
    [review, words.review],
    [failed, words.failed],
  ] as const) {
    if (items.length) clauses.push(`${prefix} ${items.map(describe).join("; ")}.`);
  }
  if (
    attempts.some(
      ({ task }) => task.reviewReason === "missing_room" || task.reviewReason === "ambiguous_room",
    )
  ) {
    clauses.push(words.clarify);
  }
  return clauses.join("\n\n");
}
