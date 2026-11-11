# Coolify deployment

The setup script creates a PostgreSQL resource and a Dockerfile app, writes runtime secrets to `.env.production`, syncs them to Coolify, and leaves both resources stopped by default. Add `--deploy` to start PostgreSQL and queue an app deployment. It does not install or configure the Coolify CLI for you.

Before running it, configure the `coolify` CLI for the target context, create or choose a server and project, register a GitHub App that can access the repository, and point an unused HTTPS domain at the server. Run `vp install` locally first.

Create `.env.deploy` with the account initialization settings and routing configuration:

```dotenv
OWNER_EMAIL=reviewer@example.com
OWNER_PASSWORD="your initial password"
OPENROUTER_API_KEY="your service key"
OPENROUTER_MODEL=your/model-id
MOCK_API_KEY="your sandbox secret"
```

Restrict access with `chmod 600 .env.deploy`. This file is ignored by Git and excluded from Docker builds. It uses dotenv syntax: quote values containing `#` or surrounding spaces. Values must be single-line. The helper reads data without executing shell substitutions.

```sh
SERVER_UUID=… \
PROJECT_UUID=… \
GITHUB_APP_UUID=… \
APP_NAME=MyApp \
REPO=owner/repository \
DOMAIN=https://app.example.com \
bash scripts/coolify-setup.sh --setup-only
```

The helper automatically reads `.env.deploy`. Select another file by adding `INPUT_ENV_FILE=.env.owner` to the command; paths are relative to the project root. An explicitly selected missing file stops setup. Every variable in the selected file is forwarded as a literal runtime setting. Owner settings must be present in the private input file; missing or invalid values stop setup before any resources are created. Shell owner variables and `.env.local` are not copied as owner settings. Exported shell variables are not automatically forwarded as runtime settings.

Do not put `DATABASE_URL`, `BETTER_AUTH_URL`, or `BETTER_AUTH_SECRET` in the input file. Setup generates these and rejects input overrides before creating resources. To use your own database or auth settings, create the Coolify resources and configure their runtime environment manually. `.env.production` is generated output, never an input file; keep your custom inputs in a separate file.

`SERVER_UUID`, `PROJECT_UUID`, `GITHUB_APP_UUID`, `APP_NAME`, `REPO`, and `DOMAIN` are setup controls supplied in the command, not the runtime input file. `BRANCH` and `ENV_NAME` default to `main` and `production`. `DB_USER` and `DB_NAME` default to `request_router`; override them in the command with lowercase PostgreSQL identifiers if needed. Runtime settings are synced with `--build-time=false --is-literal` to keep secrets out of the Docker build.

The script refuses to overwrite an existing `.env.production`. Keep that file private; it contains generated database and auth secrets along with your custom settings. Inspect it before retrying. If setup fails after creating resources, inspect and remove or reuse those resources in Coolify before retrying; deleting the local file does not undo remote creation.

Run the local mocked checks with `bash scripts/coolify-env.test.sh` and `bash scripts/coolify-setup.test.sh` before changing the setup flow.

## Keep resources stopped

Setup-only mode sets `--instant-deploy=false` and never calls a start or deploy command. It creates remote resources and saves their runtime settings; it is not a dry run. It requires an existing Coolify project, server, and GitHub App. To create the project first, run `coolify project create --name request-router` and use its UUID as `PROJECT_UUID`.

The installed Coolify CLI does not expose an automatic-deployment setting. Before pushing further commits, open the created application in Coolify and set **Advanced > Deployment > Auto deploy** to **Manual deployments only**, or disable Auto Deploy on older versions. Setup-only mode does not disable GitHub webhook deployment triggers.

The script prints the database and application UUIDs. When ready, start the existing database and deploy the existing app:

```sh
coolify database start YOUR_DATABASE_UUID
coolify deploy uuid YOUR_APPLICATION_UUID
```

Do not rerun setup to deploy resources it already created. The generated `.env.production` prevents accidental retries, but a failure before generating that file can still leave remote resources behind. Inspect Coolify before rerunning.

On first application startup, migrations run and one configured account is created before requests are accepted. Registration is disabled. Supply a valid `OWNER_EMAIL` and an initial `OWNER_PASSWORD` of 8 to 128 characters. Builds do not require these settings, and the helper syncs them as runtime-only literals.

Keep `OWNER_EMAIL` stable. Once the account exists, you can remove `OWNER_PASSWORD` from Coolify's runtime settings. Restarting keeps the stored password and sessions; changing that setting does not reset the password. There is no password recovery or rotation command. Existing databases with another account, multiple users, or incomplete credentials cause startup to fail without deleting data.

The helper creates fresh resources and requires both owner inputs. Do not rerun it to restart or rotate credentials for an existing app; use the existing app's runtime settings and redeployment controls. Reviewers can use the same credentials from separate browsers with independent sessions. Communicating those credentials is a separate operator action.
