import { createFileRoute } from "@tanstack/react-router";
import { processMessage } from "#/lib/guest-routing/process.server";

export const Route = createFileRoute("/api/process-message")({
  server: { handlers: { POST: ({ request }) => processMessage(request) } },
});
