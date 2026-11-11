import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";

function formValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = formValue(form, "email");
    const password = formValue(form, "password");

    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              email,
              password,
              name: formValue(form, "name"),
            })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong.");
        return;
      }

      void navigate({ to: "/app" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const signUp = mode === "sign-up";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{signUp ? "Create an account" : "Sign in"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {signUp ? "Set up your workspace." : "Continue to your workspace."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-busy={pending}>
          {signUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={signUp ? "new-password" : "current-password"}
            />
          </div>
          <p
            id="auth-error"
            className="min-h-5 text-sm text-destructive"
            role={error ? "alert" : undefined}
          >
            {error}
          </p>
          <Button type="submit" disabled={pending} className="w-full" aria-busy={pending}>
            {pending ? "Please wait…" : signUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {signUp ? "Already have an account? " : "Need an account? "}
          <Link className="underline underline-offset-4" to={signUp ? "/sign-in" : "/sign-up"}>
            {signUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
