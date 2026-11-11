import { spawnSync } from "node:child_process";
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
import { verifyPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";

import { db } from "#/db";
import { account, session, user } from "#/db/schema";
import { bootstrapOwner } from "./bootstrap-owner";

const email = "owner@example.test";
const password = "Owner test $='password 2026!";
const runBootstrap = () =>
  spawnSync(process.execPath, ["--import=tsx", "scripts/bootstrap-owner.ts"], {
    env: process.env,
    encoding: "utf8",
  });

// This suite clears auth data; opt in only with a disposable *_owner_test database.
describe.skipIf(process.env.OWNER_DB_TEST !== "1")("owner provisioning", () => {
  beforeAll(() => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toMatch(/_owner_test$/);
  });
  beforeEach(async () => {
    vi.stubEnv("OWNER_EMAIL", email);
    vi.stubEnv("OWNER_PASSWORD", password);
    await db.delete(user);
  });
  afterEach(() => vi.unstubAllEnvs());
  afterAll(async () => {
    await db.$client.end();
  });

  test("creates a normalized owner with a verifiable hash", async () => {
    vi.stubEnv("OWNER_EMAIL", " OWNER@Example.test ");
    expect(await bootstrapOwner()).toBe("created");
    const [owner] = await db.select().from(user);
    const [credential] = await db.select().from(account);
    expect(owner.email).toBe(email);
    expect(credential).toMatchObject({
      userId: owner.id,
      accountId: owner.id,
      providerId: "credential",
    });
    expect(credential.password).not.toBe(password);
    expect(await verifyPassword({ hash: credential.password!, password })).toBe(true);
  });

  test("concurrent first starts create one complete account", async () => {
    expect((await Promise.all([bootstrapOwner(), bootstrapOwner()])).sort()).toEqual([
      "created",
      "existing",
    ]);
    expect(await db.select().from(user)).toHaveLength(1);
    expect(await db.select().from(account)).toHaveLength(1);
  });

  test("restarts preserve identity, credentials, sessions", async () => {
    await bootstrapOwner();
    const [owner] = await db.select().from(user);
    await db.insert(session).values({
      id: crypto.randomUUID(),
      userId: owner.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 3600000),
    });
    const snapshot = async () => ({
      users: await db.select().from(user),
      accounts: await db.select().from(account),
      sessions: await db.select().from(session),
    });
    const original = await snapshot();
    for (const setting of ["Changed initial password!", undefined]) {
      vi.stubEnv("OWNER_PASSWORD", setting);
      expect(await bootstrapOwner()).toBe("existing");
      expect(await snapshot()).toEqual(original);
    }
    expect(await verifyPassword({ hash: original.accounts[0].password!, password })).toBe(true);
    expect(
      await verifyPassword({
        hash: original.accounts[0].password!,
        password: "Changed initial password!",
      }),
    ).toBe(false);
  });

  test("missing credentials fail without accounts or sensitive diagnostic output", async () => {
    vi.stubEnv("OWNER_PASSWORD", "secret!");
    const result = runBootstrap();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Set OWNER_PASSWORD");
    expect(result.stdout + result.stderr).not.toContain("secret!");
    expect(await db.select().from(user)).toEqual([]);
    vi.stubEnv("OWNER_EMAIL", "");
    await expect(bootstrapOwner()).rejects.toThrow("Set OWNER_EMAIL");
    expect(await db.select().from(account)).toEqual([]);
  });

  test("mismatched, additional, or incomplete accounts are untouched", async () => {
    await bootstrapOwner();
    const original = await db.select().from(user);
    vi.stubEnv("OWNER_EMAIL", "different@example.test");
    await expect(bootstrapOwner()).rejects.toThrow("fresh database");
    expect(await db.select().from(user)).toEqual(original);
    vi.stubEnv("OWNER_EMAIL", email);
    await db
      .insert(user)
      .values({ id: "unexpected-user", name: "Other", email: "other@example.test" });
    const withOther = await db.select().from(user);
    await expect(bootstrapOwner()).rejects.toThrow("fresh database");
    expect(await db.select().from(user)).toEqual(withOther);
    await db.delete(user);
    await db.insert(user).values({ id: "incomplete-user", name: "Owner", email });
    await expect(bootstrapOwner()).rejects.toThrow("incomplete password credentials");
    expect(await db.select().from(account)).toEqual([]);
    expect((await db.select().from(user))[0].id).toBe("incomplete-user");
  });

  test("failed credential inserts roll back and the command hides database details", async () => {
    await db.execute(
      sql`CREATE FUNCTION owner_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'sensitive database detail'; END; $$`,
    );
    await db.execute(
      sql`CREATE TRIGGER owner_test_fail BEFORE INSERT ON account FOR EACH ROW EXECUTE FUNCTION owner_test_fail()`,
    );
    try {
      const result = runBootstrap();
      expect(result.status).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output).toContain("Owner setup failed");
      expect(output).not.toContain(password);
      expect(output).not.toContain("sensitive database detail");
      expect(output).not.toContain("insert into");
      expect(await db.select().from(user)).toEqual([]);
      expect(await db.select().from(account)).toEqual([]);
    } finally {
      await db.execute(sql`DROP TRIGGER owner_test_fail ON account`);
      await db.execute(sql`DROP FUNCTION owner_test_fail()`);
    }
    expect(await bootstrapOwner()).toBe("created");
  });
});
