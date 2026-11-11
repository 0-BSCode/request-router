import { Link, createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Visayas Bay Resort</p>
      <h1 className="mt-2 text-3xl font-semibold">Guest request router</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Route guest requests to the right department and acknowledge each message.
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Project foundation ready</CardTitle>
        </CardHeader>
        <CardContent>
          The message processor and mock Tasks and Messaging APIs have not been implemented yet.
        </CardContent>
      </Card>
      <Link to="/app" className="mt-6 inline-block underline underline-offset-4">
        Open workspace
      </Link>
    </main>
  );
}
