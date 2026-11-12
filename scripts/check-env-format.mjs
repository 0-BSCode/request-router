import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

// Exercise both readers using only temporary dummy settings, never local env files.
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "request-router-env-"));
const project = `router-env-${process.pid}`;
const file = join(directory, "compose.yaml");
const fixture = join(directory, "input.env");
const dockerArgs = ["compose", "--env-file", "/dev/null", "-p", project, "-f", file];
const content = `OWNER_EMAIL="reviewer@example.test"
OWNER_PASSWORD='  spaces $cash=# "quotes"  '
OPENROUTER_API_KEY='dummy-api-key'
OPENROUTER_MODEL=example/model
MOCK_API_KEY="dummy-mock-key"
`;
const expected = parse(content);
const docker = (...args) =>
  execFileSync("docker", [...dockerArgs, ...args], { cwd: directory, encoding: "utf8" });
try {
  writeFileSync(fixture, content);
  writeFileSync(
    file,
    readFileSync(join(root, "compose.yaml"), "utf8")
      .replace("    build: .", "    image: postgres:17-alpine")
      .replace("path: .env.local", `path: ${fixture}`),
  );
  const names = Object.keys(expected);
  assert.equal(
    docker("run", "--rm", "--no-deps", "-T", "app", "printenv", ...names),
    Object.values(expected).join("\n") + "\n",
  );
  const deployment = execFileSync(
    process.execPath,
    [join(root, "scripts/coolify-env.mjs"), "append"],
    {
      cwd: directory,
      env: { ...process.env, INPUT_ENV_FILE: fixture },
      encoding: "utf8",
    },
  );
  for (const [key, value] of Object.entries(expected))
    assert.ok(deployment.split("\n").includes(`${key}='${value}'`));
  console.log(
    "Local Docker and deployment input quoting agree for dummy email, password, keys, and model.",
  );
} finally {
  try {
    docker("down", "--volumes");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
