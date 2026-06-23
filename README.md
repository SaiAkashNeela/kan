![github-background](https://github.com/user-attachments/assets/f728f52e-bf67-4357-9ba2-c24c437488e3)

<div align="center">
  <h3 align="center">Kan</h3>
  <p>The open-source project management alternative to Trello.</p>
</div>

<p align="center">
  <a href="https://kan.bn/kan/roadmap">Roadmap</a>
  ·
  <a href="https://kan.bn">Website</a>
  ·
  <a href="https://docs.kan.bn">Docs</a>
  ·
  <a href="https://discord.gg/e6ejRb6CmT">Discord</a>
</p>

<div align="center">
  <a href="https://github.com/kanbn/kan/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPLv3-purple"></a>
</div>

## Features 💫

- 👁️ **Board Visibility**: Control who can view and edit your boards
- 🤝 **Workspace Members**: Invite members and collaborate with your team
- 🚀 **Trello Imports**: Easily import your Trello boards
- 🔍 **Labels & Filters**: Organise and find cards quickly
- 💬 **Comments**: Discuss and collaborate with your team
- 📝 **Activity Log**: Track all card changes with detailed activity history
- 🎨 **Templates** : Save time with reusable custom board templates
- ⚡️ **Integrations (coming soon)** : Connect your favourite tools

See our [roadmap](https://kan.bn/kan/roadmap) for upcoming features.

## Screenshot 👁️

<img width="1507" alt="hero-dark" src="https://github.com/user-attachments/assets/8490104a-cd5d-49de-afc2-152fd8a93119" />

## Made With 🛠️

- [Next.js](https://nextjs.org/?ref=kan.bn)
- [tRPC](https://trpc.io/?ref=kan.bn)
- [Better Auth](https://better-auth.com/?ref=kan.bn)
- [Tailwind CSS](https://tailwindcss.com/?ref=kan.bn)
- [Drizzle ORM](https://orm.drizzle.team/?ref=kan.bn)
- [React Email](https://react.email/?ref=kan.bn)

## Self Hosting 🐳

### One-click Deployments

The easiest way to deploy Kan is through Railway. We've partnered with Railway to maintain an official template that supports the development of the project.

<a href="https://railway.com/deploy/kan?referralCode=bZPsr2&utm_medium=integration&utm_source=template&utm_campaign=generic">
  <img src="https://railway.app/button.svg" alt="Deploy on Railway" height="40" />
</a>

### Docker Compose

The provided `docker-compose.yml` is tuned for Dokploy-style deployments. It runs the app and migration container, and expects a managed PostgreSQL instance that you provide through `POSTGRES_URL`.

1. Set the required environment variables in your Dokploy app or in a `.env` file, including:

```env
APP_DOMAIN=kan.example.com
NEXT_PUBLIC_APP_NAME=Kan
NEXT_PUBLIC_BASE_URL=https://kan.example.com
BETTER_AUTH_SECRET=your_long_random_secret
POSTGRES_URL=postgresql://user:pass@managed-db.example.com:5432/kan
```

2. Deploy the provided `docker-compose.yml` file in Dokploy.

3. Dokploy will route the `web` service on port `3000` through your configured domain.

The `migrate` service will automatically run database migrations before the web service starts.

Use the Dokploy UI for logs, restarts, and rebuilds after code changes.

For the complete Docker Compose configuration, see [docker-compose.yml](./docker-compose.yml) in the repository.

## Local Development 🧑‍💻

1. Clone the repository (or fork)

```bash
git clone https://github.com/kanbn/kan.git
```

2. Install dependencies

```bash
pnpm install
```

3. Copy `.env.example` to `.env` and configure your environment variables
4. Migrate database

```bash
pnpm db:migrate
```

5. Start the development server

```bash
pnpm dev
```

## Environment Variables 🔐

| Variable                                  | Description                                               | Required                                    | Example                                                     |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `POSTGRES_URL`                            | PostgreSQL connection URL                                 | Yes                                         | `postgres://user:pass@managed-db.example.com:5432/db`       |
| `APP_DOMAIN`                              | Public domain used by Dokploy routing                     | For Dokploy deployments                     | `kan.example.com`                                           |
| `NEXT_PUBLIC_APP_NAME`                    | Display name used throughout the UI                       | Yes                                         | `ArivuLabs`                                                 |
| `REDIS_URL`                               | Redis connection URL                                      | For rate limiting (optional)                | `redis://localhost:6379` or `redis://redis:6379` (Docker)   |
| `EMAIL_FROM`                              | Sender email address                                      | For Email                                   | `"Kan <hello@mail.kan.bn>"`                                 |
| `SMTP_HOST`                               | SMTP server hostname                                      | For Email                                   | `smtp.resend.com`                                           |
| `SMTP_PORT`                               | SMTP server port                                          | For Email                                   | `465`                                                       |
| `SMTP_USER`                               | SMTP username/email                                       | No                                          | `resend`                                                    |
| `SMTP_PASSWORD`                           | SMTP password/token                                       | No                                          | `re_xxxx`                                                   |
| `SMTP_SECURE`                             | Use secure SMTP connection (defaults to true if not set)  | For Email                                   | `true`                                                      |
| `SMTP_REJECT_UNAUTHORIZED`                | Reject invalid certificates (defaults to true if not set) | For Email                                   | `false`                                                     |
| `NEXT_PUBLIC_DISABLE_EMAIL`               | To disable all email features                             | For Email                                   | `true`                                                      |
| `NEXT_PUBLIC_BASE_URL`                    | Base URL of your installation                             | Yes                                         | `http://localhost:3000`                                     |
| `NEXT_API_BODY_SIZE_LIMIT`                | Maximum API request body size (defaults to 1mb)           | No                                          | `50mb`                                                      |
| `BETTER_AUTH_ALLOWED_DOMAINS`             | Comma-separated list of allowed domains for OIDC logins   | For OIDC/Social login                       | `example.com,subsidiary.com`                                |
| `BETTER_AUTH_SECRET`                      | Auth encryption secret                                    | Yes                                         | Random 32+ char string                                      |
| `BETTER_AUTH_TRUSTED_ORIGINS`             | Allowed callback origins                                  | No                                          | `http://localhost:3000,http://localhost:3001`               |
| `GOOGLE_CLIENT_ID`                        | Google OAuth client ID                                    | For Google login                            | `xxx.apps.googleusercontent.com`                            |
| `GOOGLE_CLIENT_SECRET`                    | Google OAuth client secret                                | For Google login                            | `xxx`                                                       |
| `DISCORD_CLIENT_ID`                       | Discord OAuth client ID                                   | For Discord login                           | `xxx`                                                       |
| `DISCORD_CLIENT_SECRET`                   | Discord OAuth client secret                               | For Discord login                           | `xxx`                                                       |
| `GITHUB_CLIENT_ID`                        | GitHub OAuth client ID                                    | For GitHub login                            | `xxx`                                                       |
| `GITHUB_CLIENT_SECRET`                    | GitHub OAuth client secret                                | For GitHub login                            | `xxx`                                                       |
| `OIDC_CLIENT_ID`                          | Generic OIDC client ID                                    | For OIDC login                              | `xxx`                                                       |
| `OIDC_CLIENT_SECRET`                      | Generic OIDC client secret                                | For OIDC login                              | `xxx`                                                       |
| `OIDC_DISCOVERY_URL`                      | OIDC discovery URL                                        | For OIDC login                              | `https://auth.example.com/.well-known/openid-configuration` |
| `TRELLO_APP_API_KEY`                      | Trello app API key                                        | For Trello import                           | `xxx`                                                       |
| `TRELLO_APP_API_SECRET`                   | Trello app API secret                                     | For Trello import                           | `xxx`                                                       |
| `S3_REGION`                               | S3 storage region                                         | For file uploads                            | `WEUR`                                                      |
| `S3_ENDPOINT`                             | S3 endpoint URL                                           | For file uploads                            | `https://xxx.r2.cloudflarestorage.com`                      |
| `S3_ACCESS_KEY_ID`                        | S3 access key                                             | For file uploads (optional with IRSA)       | `xxx`                                                       |
| `S3_SECRET_ACCESS_KEY`                    | S3 secret key                                             | For file uploads (optional with IRSA)       | `xxx`                                                       |
| `S3_FORCE_PATH_STYLE`                     | Use path-style URLs for S3                                | For file uploads                            | `true`                                                      |
| `S3_AVATAR_UPLOAD_LIMIT`                  | Maximum avatar file size in bytes                         | For file uploads                            | `2097152` (2MB)                                             |
| `NEXT_PUBLIC_STORAGE_URL`                 | Storage service URL                                       | For file uploads                            | `https://storage.kanbn.com`                                 |
| `NEXT_PUBLIC_STORAGE_DOMAIN`              | Storage domain name                                       | For file uploads                            | `kanbn.com`                                                 |
| `NEXT_PUBLIC_USE_VIRTUAL_HOSTED_URLS`     | Use virtual-hosted style URLs (bucket.domain.com)         | For file uploads (optional)                 | `true`                                                      |
| `NEXT_PUBLIC_AVATAR_BUCKET_NAME`          | S3 bucket name for avatars                                | For file uploads                            | `avatars`                                                   |
| `NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME`     | S3 bucket name for attachments                            | For file uploads                            | `attachments`                                               |
| `NEXT_PUBLIC_ALLOW_CREDENTIALS`           | Allow email & password login                              | For authentication                          | `true`                                                      |
| `NEXT_PUBLIC_DISABLE_SIGN_UP`             | Disable sign up                                           | For authentication                          | `false`                                                     |
| `NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY` | Hide “Powered by kan.bn” on public boards (self-host)     | For white labelling                         | `true`                                                      |
| `KAN_ADMIN_API_KEY`                       | Admin API key for stats and admin endpoints               | For admin/monitoring                        | `your-secret-admin-key`                                     |
| `LOG_LEVEL`                               | Log verbosity level (debug, info, warn, error)            | No (defaults to debug in dev, info in prod) | `info`                                                      |

See `.env.example` for a complete list of supported environment variables.

## MCP Server (AI Control) 🤖

Kan ships with a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that lets any MCP-compatible AI client — GitHub Copilot, Claude Desktop, Cursor, Codex, and others — read and control your Kan instance using natural language.

### Prerequisites

- Node.js 18+
- A running Kan instance (self-hosted or cloud)
- A Kan API key (Settings → API Keys → Create key)

### Installation

You do **not** need to clone this repository. The recommended way is to use `npx`, which runs the server on-demand and always uses the latest version — no global install required:

```bash
npx -y @kan/mcp
```

Alternatively, install it globally:

```bash
npm install -g @kan/mcp
kan-mcp
```

### Configuration

The server is configured via two environment variables:

| Variable        | Description                         | Example                        |
| --------------- | ----------------------------------- | ------------------------------ |
| `KAN_BASE_URL`  | Base URL of your Kan instance       | `https://your-kan.example.com` |
| `KAN_API_TOKEN` | API key from your Kan user settings | `kan_xxxxxxxxxxxx`             |

#### GitHub Copilot (VS Code)

Add the following to your VS Code `mcp.json` (open it via **MCP: Open User MCP Configuration** from the Command Palette):

```json
{
  "servers": {
    "kan": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@kan/mcp"],
      "env": {
        "KAN_BASE_URL": "https://your-kan-instance.com",
        "KAN_API_TOKEN": "kan_your_api_key_here"
      }
    }
  }
}
```

Then use Copilot in **Agent mode** to interact with Kan.

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "kan": {
      "command": "npx",
      "args": ["-y", "@kan/mcp"],
      "env": {
        "KAN_BASE_URL": "https://your-kan-instance.com",
        "KAN_API_TOKEN": "kan_your_api_key_here"
      }
    }
  }
}
```

#### Cursor / Codex / other clients

Use the same `command` + `args` + `env` pattern above — all MCP stdio clients follow the same format.

### Example prompts

Once connected, you can ask your AI assistant things like:

**Browsing**

- _"List all my workspaces"_
- _"Show me all boards in the Marketing workspace"_
- _"What cards are in the Backlog list of the Q3 Planning board?"_
- _"Get the full details of card X including comments and checklists"_

**Managing cards**

- _"Create a card called 'Fix login bug' in the To Do list of the Dev board"_
- _"Move the 'API redesign' card to the In Progress list"_
- _"Set a due date of next Friday on the 'Write docs' card"_
- _"Add a comment to the 'Deploy to prod' card saying the deployment is blocked"_
- _"Duplicate the 'Sprint template' card into the new Sprint 4 list"_
- _"Mark the 'Setup CI' checklist item as complete"_

**Organisation**

- _"Add the 'urgent' label to all cards assigned to me in the Backend board"_
- _"Create a 'Release checklist' checklist on the v2.0 card with items: smoke test, update changelog, tag release"_
- _"What tasks are assigned to @alice in the Mechanics Rework board?"_

**Workspace management**

- _"Create a new workspace called 'Client Projects'"_
- _"Invite bob@example.com to the Marketing workspace as a member"_
- _"Create a new board called 'Sprint 5' in the Dev workspace with lists: Backlog, In Progress, Done"_
- _"Search for anything related to 'authentication' across the Dev workspace"_

### Available tools

The MCP server exposes 46 tools across 7 resource types:

| Resource          | Tools                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Workspaces        | list, find by name, get, create, update, delete, search, check slug |
| Boards            | list, find by name, get, get by slug, create, update, delete        |
| Lists             | create, update, delete                                              |
| Cards             | create, get, update, delete, duplicate, get activities              |
| Card interactions | add/update/delete comment, toggle label, toggle member              |
| Checklists        | create, update, delete, create item, update item, delete item       |
| Labels            | get, create, update, delete                                         |
| Members           | invite, remove, update role, manage invite links                    |

## Contributing 🤝

We welcome contributions! Please read our [contribution guidelines](CONTRIBUTING.md) before submitting a pull request.

## Contributors 👥

<a href="https://github.com/kanbn/kan/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kanbn/kan" />
</a>

## Sponsors ❤️

[<img height="100" alt="image" src="https://github.com/user-attachments/assets/e331c71f-ac86-46a6-bceb-ce276de094b0" />](https://www.testmuai.com)

Proudly sponsored by [TestMu AI (formerly LambdaTest)](https://www.testmuai.com) - an AI-native testing cloud platform built for modern engineering teams. Covering everything from autonomous test creation and fast execution to testing AI agents like chatbots and voice assistants. If you're serious about testing, go check them out.

## License 📝

Kan is licensed under the [AGPLv3 license](LICENSE).

## Contact 📧

For support or to get in touch, please email [henry@kan.bn](mailto:henry@kan.bn) or join our [Discord server](https://discord.gg/e6ejRb6CmT).
