import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";
import { Card, CardContent } from "#/components/ui/card";
import { formatExample, mockApiErrors, mockApiExamples } from "#/lib/guest-routing/api-examples";

const headers = "Content-Type: application/json\nAuthorization: Bearer <MOCK_API_KEY>";

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <h3 className="text-sm font-medium">{label}</h3>
      <pre className="bg-muted max-w-full overflow-x-auto rounded-md p-3 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MockApiReference() {
  const [open, setOpen] = useState<string[]>([]);
  return (
    <div className="mt-6 space-y-6">
      <p className="text-muted-foreground text-sm">
        Static, synthetic examples of the mock APIs the router calls. A 201 response only simulates
        acceptance: nothing is stored and no guest is contacted. The key shown is a placeholder, not
        a real credential.
      </p>
      <Accordion.Root type="multiple" value={open} onValueChange={setOpen} className="space-y-6">
        {mockApiExamples.map((example) => (
          <Accordion.Item key={example.path} value={example.path} asChild>
            <Card className="gap-0 py-0">
              <Accordion.Header asChild>
                <h2>
                  <Accordion.Trigger className="group focus-visible:ring-ring flex w-full items-center justify-between gap-4 rounded-xl px-6 py-5 text-left outline-none focus-visible:ring-2">
                    <span className="space-y-1.5">
                      <span className="block leading-none font-semibold">{example.title}</span>
                      <code className="text-muted-foreground block text-sm font-normal">
                        POST {example.path}
                      </code>
                    </span>
                    <ChevronDown
                      aria-hidden
                      className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                </h2>
              </Accordion.Header>
              {/* Force-mounted so the examples stay in the markup; forceMount disables Radix's own hiding. */}
              <Accordion.Content forceMount hidden={!open.includes(example.path)}>
                <CardContent className="space-y-4 pb-6">
                  <CodeBlock label="Headers" code={headers} />
                  <CodeBlock label="Request body" code={formatExample(example.request)} />
                  <CodeBlock label="Example 201 response" code={formatExample(example.response)} />
                  <div>
                    <h3 className="text-sm font-medium">Errors</h3>
                    <ul className="text-muted-foreground mt-1 list-disc space-y-1 pl-5 text-sm">
                      {mockApiErrors.map((error) => (
                        <li key={error.status}>
                          <strong>{error.status}</strong>: {error.meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Accordion.Content>
            </Card>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
