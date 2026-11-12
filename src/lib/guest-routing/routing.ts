import { isSupportedLanguage } from "./languages";
import type { Extraction, GuestMessage, Task } from "./contracts";

export const departments = {
  towels: "housekeeping",
  late_checkout: "front_desk",
  complaint: "front_desk",
  tour: "concierge",
  unknown: "front_desk",
} as const;

const reviewDetails = {
  extraction_failure: "Review the guest message. Automatic extraction failed.",
  unsupported_language:
    "Review the guest message. Its detected language is not supported for automatic routing.",
  uncertain_language: "Review the guest message. Its language could not be identified reliably.",
  no_actionable_request: "Review the guest message. No actionable request was identified.",
};

export function routeRequests(message: GuestMessage, extraction: Extraction | null): Task[] {
  const base = {
    messageId: message.messageId,
    channel: message.channel,
    sender: message.sender,
    originalMessage: message.text,
    detectedLanguage: extraction?.detectedLanguage ?? "unknown",
  };
  const wholeReason = !extraction
    ? "extraction_failure"
    : extraction.detectedLanguage === "unknown"
      ? "uncertain_language"
      : !isSupportedLanguage(extraction.detectedLanguage)
        ? "unsupported_language"
        : !extraction.requests.length
          ? "no_actionable_request"
          : null;
  if (wholeReason) {
    return [
      {
        ...base,
        type: "unknown",
        details: reviewDetails[wholeReason],
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
