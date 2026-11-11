import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { eq } from "drizzle-orm";

// Opt in only against a migrated, disposable database ending in _auth_test.
describe.skipIf(process.env.AUTH_DB_TEST !== "1")("database authentication", () => {
  let auth: typeof import("./auth").auth;
  let db: typeof import("#/db").db;
  let schema: typeof import("#/db/schema");
  const email = `reviewer-${crypto.randomUUID()}@example.test`;
  const password = "Local auth test password 2026!";
  const origin = "http://localhost:3000";

  beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toMatch(/_auth_test$/);
    ({ auth } = await import("./auth"));
    ({ db } = await import("#/db"));
    schema = await import("#/db/schema");
  });

  afterAll(async () => {
    if (db) {
      try {
        await db.delete(schema.user).where(eq(schema.user.email, email));
      } finally {
        await db.$client.end();
      }
    }
  });

  function post(path: string, body: object, cookie = "") {
    return auth.handler(
      new Request(`${origin}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", origin, cookie },
        body: JSON.stringify(body),
      }),
    );
  }

  test("persists accounts, rejects bad passwords, and invalidates signed-out sessions", async () => {
    expect(await auth.api.getSession({ headers: new Headers() })).toBeNull();
    const signup = await post("sign-up/email", { name: "Reviewer", email, password });
    expect(signup.status).toBe(200);
    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    const [account] = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, user.id));
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe(password);
    expect((await post("sign-in/email", { email, password: "incorrect password" })).status).toBe(
      401,
    );
    const signin = await post("sign-in/email", { email, password });
    expect(signin.status).toBe(200);
    const cookie = signin.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const headers = new Headers({ cookie });
    expect((await auth.api.getSession({ headers }))?.user.email).toBe(email);
    expect((await post("sign-out", {}, cookie)).status).toBe(200);
    expect(await auth.api.getSession({ headers })).toBeNull();
  });
});
