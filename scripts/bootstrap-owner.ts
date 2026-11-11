import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("../src/db/index");
const { bootstrapOwner } = await import("../src/lib/bootstrap-owner");
const { OwnerSetupError } = await import("../src/lib/owner");

try {
  const result = await bootstrapOwner();
  console.log(
    result === "created"
      ? "Owner account created."
      : "Owner account already initialized; credentials unchanged.",
  );
} catch (error) {
  console.error(
    error instanceof OwnerSetupError
      ? error.message
      : "Owner setup failed. Check database connectivity and migrations. No credentials were printed.",
  );
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
