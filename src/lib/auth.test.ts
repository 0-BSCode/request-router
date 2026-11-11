import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { auth, getOwnerSession } from "./auth";
import { bootstrapOwner } from "./bootstrap-owner";
import { processMessage } from "./guest-routing/process.server";

const email = "owner@example.test";
const password = "Owner test password 2026!";
const origin = "http://localhost:3000";
const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
const post = (path: string, body: object, cookie = "") =>
  auth.handler(
    new Request(`${origin}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", origin, cookie },
      body: JSON.stringify(body),
    }),
  );

// This suite clears auth data; opt in only with a disposable *_owner_test database.
describe.skipIf(process.env.AUTH_DB_TEST !== "1")("owner authentication", () => {
  beforeAll(() => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toMatch(/_owner_test$/);
  });
  beforeEach(async () => {
    vi.stubEnv("OWNER_EMAIL", email);
    vi.stubEnv("OWNER_PASSWORD", password);
    await db.delete(schema.user);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  afterAll(async () => {
    await db.$client.end();
  });

  test("registration is disabled on empty and initialized databases", async () => {
    for (const initialized of [false, true]) {
      if (initialized) await bootstrapOwner();
      expect(
        (await post("sign-up/email", { name: "Visitor", email: "visitor@example.test", password }))
          .ok,
      ).toBe(false);
      expect(await db.select().from(schema.user)).toHaveLength(initialized ? 1 : 0);
      expect(await db.select().from(schema.session)).toEqual([]);
    }
  });

  test("owner sessions coexist and signing out invalidates only that session", async () => {
    await bootstrapOwner();
    expect(await getOwnerSession(new Headers())).toBeNull();
    expect((await post("sign-in/email", { email, password: "incorrect password" })).status).toBe(
      401,
    );
    const first = await post("sign-in/email", { email, password });
    const second = await post("sign-in/email", { email, password });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstCookie = cookies(first),
      secondCookie = cookies(second);
    expect(firstCookie).not.toBe(secondCookie);
    expect((await getOwnerSession(new Headers({ cookie: firstCookie })))?.user.email).toBe(email);
    expect((await getOwnerSession(new Headers({ cookie: secondCookie })))?.user.email).toBe(email);
    expect((await post("sign-out", {}, firstCookie)).status).toBe(200);
    expect(await getOwnerSession(new Headers({ cookie: firstCookie }))).toBeNull();
    expect((await getOwnerSession(new Headers({ cookie: secondCookie })))?.user.email).toBe(email);
  });

  test("non-owners cannot sign in and old sessions cannot process messages", async () => {
    await bootstrapOwner();
    const id = crypto.randomUUID();
    const otherEmail = "other@example.test";
    await db.insert(schema.user).values({ id, name: "Other", email: otherEmail });
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: await hashPassword(password),
    });
    // Issue a genuine legacy session using the old unrestricted auth configuration.
    const legacy = betterAuth({
      database: drizzleAdapter(db, { provider: "pg", schema }),
      emailAndPassword: { enabled: true },
    });
    const response = await legacy.handler(
      new Request(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", origin },
        body: JSON.stringify({ email: otherEmail, password }),
      }),
    );
    expect(response.status).toBe(200);
    const cookie = cookies(response),
      headers = new Headers({ cookie });
    expect(await auth.api.getSession({ headers })).not.toBeNull();
    expect(await getOwnerSession(headers)).toBeNull();
    expect((await post("sign-in/email", { email: otherEmail, password })).ok).toBe(false);
    vi.stubGlobal("fetch", vi.fn());
    expect(
      (
        await processMessage(
          new Request(`${origin}/api/process-message`, { method: "POST", headers }),
        )
      ).status,
    ).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("missing or invalid owner settings deny existing sessions and new sign-ins", async () => {
    await bootstrapOwner();
    const response = await post("sign-in/email", { email, password });
    expect(response.status).toBe(200);
    const headers = new Headers({ cookie: cookies(response) });
    for (const setting of [undefined, "invalid-email"]) {
      vi.stubEnv("OWNER_EMAIL", setting);
      expect(await getOwnerSession(headers)).toBeNull();
      expect((await post("sign-in/email", { email, password })).ok).toBe(false);
    }
  });
});
