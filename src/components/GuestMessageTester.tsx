import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import {
  channelSchema,
  messageSchema,
  processingResultSchema,
  type ProcessingResult,
} from "#/lib/guest-routing/contracts";
import { samples, testSenders } from "#/lib/guest-routing/samples";

const departmentLabels = {
  housekeeping: "Housekeeping",
  front_desk: "Front desk",
  concierge: "Concierge",
};
const reviewLabels = {
  unknown_request: "Unknown request",
  missing_room: "Missing room: clarification requested",
  ambiguous_room: "Ambiguous room: clarification requested",
  extraction_failure: "Extraction failed",
  unsupported_language: "Unsupported language",
  uncertain_language: "Uncertain language",
  no_actionable_request: "No actionable request identified",
};

export function GuestMessageTester() {
  const [sampleId, setSampleId] = useState(samples[0].messageId);
  const [channel, setChannel] = useState(samples[0].channel);
  const [text, setText] = useState(samples[0].text);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [submittedText, setSubmittedText] = useState("");

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setResult(null);
    setError("");
    setSignInRequired(false);
    const parsed = messageSchema.safeParse({
      messageId: crypto.randomUUID(),
      channel,
      sender: testSenders[channel],
      text,
    });
    if (!parsed.success) {
      setError("Enter a message of 1 to 5000 characters and choose a channel.");
      return;
    }
    setSubmittedText(parsed.data.text);
    setPending(true);
    try {
      const response = await fetch("/api/process-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        setSignInRequired(response.status === 401);
        setError(
          typeof body.error === "string" ? body.error : "The message could not be processed.",
        );
        return;
      }
      setResult(processingResultSchema.parse(body));
    } catch {
      setError(
        "The server could not return a valid result. Check your connection before submitting again; some work may already have been recorded.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test a guest message</CardTitle>
          <p className="text-sm text-muted-foreground">
            Uses OpenRouter for understanding. Tasks and replies are simulated; use synthetic guest
            messages only.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sample">Sample message</Label>
                <Select
                  value={sampleId}
                  disabled={pending}
                  onValueChange={(id) => {
                    const sample = samples.find((item) => item.messageId === id);
                    if (sample) {
                      setSampleId(id);
                      setChannel(sample.channel);
                      setText(sample.text);
                    }
                  }}
                >
                  <SelectTrigger id="sample" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {samples.map((sample) => (
                      <SelectItem key={sample.messageId} value={sample.messageId}>
                        {sample.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select
                  value={channel}
                  disabled={pending}
                  onValueChange={(value) => setChannel(channelSchema.parse(value))}
                >
                  <SelectTrigger id="channel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-message">Guest message</Label>
              <Textarea
                id="guest-message"
                value={text}
                disabled={pending}
                maxLength={5000}
                rows={5}
                aria-describedby="message-help"
                aria-invalid={text.trim().length === 0 && !!error}
                onChange={(event) => setText(event.target.value)}
              />
              <p id="message-help" className="text-sm text-muted-foreground">
                Include the room in the message to test extraction. {text.length}/5000 characters.
              </p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Processing…" : "Process message"}
            </Button>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {pending
                ? "Understanding the message and recording mock outcomes…"
                : result
                  ? "Processing complete. Review each outcome below."
                  : ""}
            </p>
            {error && (
              <div role="alert" className="text-sm text-destructive">
                <p>{error}</p>
                {signInRequired && (
                  <Link to="/sign-in" className="underline">
                    Sign in again
                  </Link>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      {result && (
        <section aria-label="Processing results" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Results for this submission</h3>
            <p className="text-xs text-muted-foreground">Message {result.messageId}</p>
            <p className="mt-2 whitespace-pre-wrap">{submittedText}</p>
          </div>
          {result.extractionError && (
            <p role="alert" className="text-sm text-destructive">
              {result.extractionError}
            </p>
          )}
          <h4 className="font-semibold">
            Task attempts <Badge variant="outline">Mock Tasks API</Badge>
          </h4>
          {result.tasks.map((attempt, index) => (
            <Card key={`${result.messageId}-${index}`}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {departmentLabels[attempt.task.department]}
                  <Badge variant={attempt.status === "failed" ? "destructive" : "secondary"}>
                    {attempt.status === "created" ? "Created" : "Failed"}
                  </Badge>
                  {attempt.task.needsReview && <Badge variant="outline">Needs review</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap">{attempt.task.details}</p>
                <p>
                  Type: {attempt.task.type.replaceAll("_", " ")} · Room:{" "}
                  {attempt.task.room ?? "Unknown"}
                </p>
                {attempt.task.reviewReason && <p>{reviewLabels[attempt.task.reviewReason]}</p>}
                <details>
                  <summary className="cursor-pointer">Original supporting text</summary>
                  <p className="mt-2 whitespace-pre-wrap">{attempt.task.sourceText}</p>
                </details>
                {attempt.status === "created" ? (
                  <p className="text-xs text-muted-foreground">Task {attempt.taskId}</p>
                ) : (
                  <p className="text-destructive">{attempt.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                Guest acknowledgement <Badge variant="outline">Mock Messaging API</Badge>
                <Badge
                  variant={result.acknowledgement.status === "failed" ? "destructive" : "secondary"}
                >
                  {result.acknowledgement.status === "sent" ? "Sent" : "Failed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap">{result.acknowledgement.text}</p>
              {result.acknowledgement.status === "sent" ? (
                <p className="text-xs text-muted-foreground">
                  Delivery {result.acknowledgement.deliveryId}
                </p>
              ) : (
                <p className="text-destructive">{result.acknowledgement.error}</p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
