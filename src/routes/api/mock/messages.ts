import { createFileRoute } from "@tanstack/react-router";
import { sendMockMessage } from "#/lib/guest-routing/mocks.server";

export const Route = createFileRoute("/api/mock/messages")({
  server: { handlers: { POST: ({ request }) => sendMockMessage(request) } },
});
