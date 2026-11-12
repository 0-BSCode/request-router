import { z } from "zod";
import { detectedLanguageSchema } from "./languages";

export const channelSchema = z.enum(["whatsapp", "email"]);
export const requestTypeSchema = z.enum([
  "towels",
  "late_checkout",
  "complaint",
  "tour",
  "unknown",
]);
export const departmentSchema = z.enum(["housekeeping", "front_desk", "concierge"]);
const identifier = z.string().trim().min(1).max(200);
const messageText = z.string().trim().min(1).max(5000);

export const messageSchema = z.strictObject({
  messageId: identifier,
  channel: channelSchema,
  sender: identifier,
  text: messageText,
});

export const extractedRequestSchema = z
  .strictObject({
    type: requestTypeSchema,
    details: messageText,
    sourceText: messageText,
    room: z.string().min(1).max(40).nullable(),
    roomSourceText: messageText.nullable(),
    roomStatus: z.enum(["known", "missing", "ambiguous"]),
  })
  .refine(
    (item) =>
      item.roomStatus === "known"
        ? item.room !== null && item.roomSourceText !== null
        : item.room === null,
    "Room must match its certainty state",
  );

export const extractionSchema = z.strictObject({
  // A supported-language mixture with no dominant language uses English replies.
  detectedLanguage: detectedLanguageSchema,
  requests: z.array(extractedRequestSchema),
});

export const reviewReasonSchema = z.enum([
  "unknown_request",
  "missing_room",
  "ambiguous_room",
  "extraction_failure",
  "unsupported_language",
  "uncertain_language",
  "no_actionable_request",
]);

export const taskSchema = z
  .strictObject({
    messageId: identifier,
    channel: channelSchema,
    sender: identifier,
    type: requestTypeSchema,
    details: messageText,
    sourceText: messageText,
    originalMessage: messageText,
    detectedLanguage: detectedLanguageSchema,
    room: z.string().min(1).max(40).nullable(),
    department: departmentSchema,
    needsReview: z.boolean(),
    reviewReason: reviewReasonSchema.nullable(),
  })
  .refine(
    (task) =>
      task.needsReview
        ? task.department === "front_desk" && task.reviewReason !== null
        : task.room !== null && task.type !== "unknown" && task.reviewReason === null,
    "Review state must match routing",
  );

export const outgoingMessageSchema = z.strictObject({
  messageId: identifier,
  channel: channelSchema,
  recipient: identifier,
  text: z.string().min(1).max(10000),
});
export const taskReceiptSchema = z.strictObject({ taskId: identifier });
export const deliveryReceiptSchema = z.strictObject({ deliveryId: identifier });

export const taskAttemptSchema = z.discriminatedUnion("status", [
  z.strictObject({ task: taskSchema, status: z.literal("created"), taskId: identifier }),
  z.strictObject({ task: taskSchema, status: z.literal("failed"), error: z.string() }),
]);
export const acknowledgementSchema = z.discriminatedUnion("status", [
  z.strictObject({ text: z.string(), status: z.literal("sent"), deliveryId: identifier }),
  z.strictObject({ text: z.string(), status: z.literal("failed"), error: z.string() }),
]);
export const processingResultSchema = z.strictObject({
  messageId: identifier,
  extractionStatus: z.enum(["extracted", "review", "failed"]),
  extractionError: z.string().optional(),
  tasks: z.array(taskAttemptSchema),
  acknowledgement: acknowledgementSchema,
});

export type GuestMessage = z.infer<typeof messageSchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export type ExtractedRequest = z.infer<typeof extractedRequestSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskAttempt = z.infer<typeof taskAttemptSchema>;
export type ProcessingResult = z.infer<typeof processingResultSchema>;
