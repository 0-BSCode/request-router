// Static, synthetic documentation for the mock APIs; validated against the shared schemas in tests.
const towelMessage = "Hi, could we get two extra towels in room 204 please?";

export const mockApiExamples = [
  {
    title: "Tasks API",
    path: "/api/mock/tasks",
    request: {
      messageId: "example-message-001",
      channel: "whatsapp",
      sender: "+15550100204",
      type: "towels",
      details: "Guest requests two extra towels.",
      sourceText: "could we get two extra towels in room 204",
      originalMessage: towelMessage,
      detectedLanguage: "en",
      room: "204",
      department: "housekeeping",
      needsReview: false,
      reviewReason: null,
    },
    response: { taskId: "example-task-001" },
  },
  {
    title: "Messaging API",
    path: "/api/mock/messages",
    request: {
      messageId: "example-message-001",
      channel: "whatsapp",
      recipient: "+15550100204",
      text: "We've passed your towel request for room 204 to housekeeping.",
    },
    response: { deliveryId: "example-delivery-001" },
  },
] as const;

export const mockApiErrors = [
  { status: 400, meaning: "Invalid payload: the JSON body does not match the contract." },
  { status: 401, meaning: "Invalid sandbox credential: the bearer key is missing or wrong." },
  { status: 503, meaning: "Mock API is not configured on the server." },
] as const;

export const formatExample = (value: unknown) => JSON.stringify(value, null, 2);
