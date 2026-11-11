import { expect, test } from "vite-plus/test";
import { extractedRequestSchema, messageSchema } from "./contracts";

const message = {
  messageId: "test",
  sender: "guest@example.test",
  channel: "email",
  text: "Towels please",
};

test("message boundaries reject invalid inputs", () => {
  expect(messageSchema.parse(message).text).toBe("Towels please");
  for (const change of [
    { text: "   " },
    { text: "a".repeat(5001) },
    { channel: "sms" },
    { sender: "" },
  ]) {
    expect(messageSchema.safeParse({ ...message, ...change }).success).toBe(false);
  }
});

test("room and certainty must agree", () => {
  const item = {
    type: "towels",
    details: "Towels",
    sourceText: "Towels",
    room: null,
    roomSourceText: null,
    roomStatus: "missing",
  };
  expect(extractedRequestSchema.safeParse(item).success).toBe(true);
  expect(extractedRequestSchema.safeParse({ ...item, roomStatus: "known" }).success).toBe(false);
  expect(extractedRequestSchema.safeParse({ ...item, room: "204" }).success).toBe(false);
});
