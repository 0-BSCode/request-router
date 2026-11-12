import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
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
import { getLanguageLabel, getLanguageSupportLabel } from "#/lib/guest-routing/languages";
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

const tabClass =
  "text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground focus-visible:ring-ring -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2";
const chipClass =
  "text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2";
const formatType = (type: string) =>
  type.charAt(0).toUpperCase() + type.slice(1).replaceAll("_", " ");

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
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Test a guest message</CardTitle>
          <p className="text-sm text-muted-foreground">
            Uses OpenRouter for understanding. Tasks and replies are simulated; use synthetic guest
            messages only.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
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
                  ? "Processing complete. Review each outcome in the results."
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
      <section aria-label="Processing results" className="min-w-0">
        {result ? (
          // Keyed by message so each new result opens on Tasks with the first chip selected.
          <div key={result.messageId} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Results for this submission</h2>
              <p className="text-xs text-muted-foreground">Message {result.messageId}</p>
              <p className="mt-2 whitespace-pre-wrap">{submittedText}</p>
            </div>
            {result.extractionError && (
              <p role="alert" className="text-sm text-destructive">
                {result.extractionError}
              </p>
            )}
            <Tabs.Root defaultValue="tasks">
              <Tabs.List aria-label="Result views" className="flex border-b">
                <Tabs.Trigger value="tasks" className={tabClass}>
                  Tasks ({result.tasks.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="reply" className={tabClass}>
                  Guest reply
                  {result.acknowledgement.status === "failed" && (
                    <span className="ml-1.5 text-destructive">Failed</span>
                  )}
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="tasks" className="space-y-3 pt-4">
                <Badge variant="outline">Mock Tasks API</Badge>
                {result.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No task was created.</p>
                ) : (
                  <Tabs.Root defaultValue="0">
                    <Tabs.List aria-label="Task attempts" className="flex flex-wrap gap-2">
                      {result.tasks.map((attempt, index) => (
                        <Tabs.Trigger key={index} value={String(index)} className={chipClass}>
                          {index + 1}. {departmentLabels[attempt.task.department]} ·{" "}
                          {formatType(attempt.task.type)}
                          {attempt.status === "failed" && (
                            <span className="text-destructive">Failed</span>
                          )}
                          {attempt.task.needsReview && <span className="underline">Review</span>}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>
                    {result.tasks.map((attempt, index) => (
                      <Tabs.Content key={index} value={String(index)} className="mt-3">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                              {departmentLabels[attempt.task.department]}
                              <Badge
                                variant={attempt.status === "failed" ? "destructive" : "secondary"}
                              >
                                {attempt.status === "created" ? "Created" : "Failed"}
                              </Badge>
                              {attempt.task.needsReview && (
                                <Badge variant="outline">Needs review</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p className="whitespace-pre-wrap">{attempt.task.details}</p>
                            <p>
                              Guest language: {getLanguageLabel(attempt.task.detectedLanguage)} ·{" "}
                              {getLanguageSupportLabel(attempt.task.detectedLanguage)}
                            </p>
                            <p>
                              Type: {attempt.task.type.replaceAll("_", " ")} · Room:{" "}
                              {attempt.task.room ?? "Unknown"}
                            </p>
                            {attempt.task.reviewReason && (
                              <p>{reviewLabels[attempt.task.reviewReason]}</p>
                            )}
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
                      </Tabs.Content>
                    ))}
                  </Tabs.Root>
                )}
              </Tabs.Content>
              <Tabs.Content value="reply" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      Guest acknowledgement <Badge variant="outline">Mock Messaging API</Badge>
                      <Badge
                        variant={
                          result.acknowledgement.status === "failed" ? "destructive" : "secondary"
                        }
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
              </Tabs.Content>
            </Tabs.Root>
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {pending
              ? "Processing the message. Results will appear here."
              : "Results appear here after you process a message."}
          </p>
        )}
      </section>
    </div>
  );
}
