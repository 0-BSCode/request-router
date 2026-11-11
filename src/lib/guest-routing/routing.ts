import type { Extraction, GuestMessage, Task } from "./contracts";

export const departments = {
  towels: "housekeeping",
  late_checkout: "front_desk",
  complaint: "front_desk",
  tour: "concierge",
  unknown: "front_desk",
} as const;

export function routeRequests(message: GuestMessage, extraction: Extraction | null): Task[] {
  const base = {
    messageId: message.messageId,
    channel: message.channel,
    sender: message.sender,
    originalMessage: message.text,
  };
  const wholeReason = !extraction
    ? "extraction_failure"
    : extraction.language === "unsupported"
      ? "unsupported_language"
      : extraction.language === "unknown"
        ? "uncertain_language"
        : !extraction.requests.length
          ? "no_actionable_request"
          : null;
  if (wholeReason) {
    return [
      {
        ...base,
        type: "unknown",
        details: message.text,
        sourceText: message.text,
        room: null,
        department: "front_desk",
        needsReview: true,
        reviewReason: wholeReason,
      },
    ];
  }
  return extraction!.requests.map((item) => {
    const reviewReason =
      item.roomStatus === "missing"
        ? "missing_room"
        : item.roomStatus === "ambiguous"
          ? "ambiguous_room"
          : item.type === "unknown"
            ? "unknown_request"
            : null;
    return {
      ...base,
      type: item.type,
      details: item.details,
      sourceText: item.sourceText,
      room: item.room,
      department: reviewReason ? "front_desk" : departments[item.type],
      needsReview: reviewReason !== null,
      reviewReason,
    };
  });
}
