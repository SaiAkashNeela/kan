# Notes, Branding, and Docker Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded product branding with environment-driven branding, remove local PostgreSQL container infrastructure from Docker, and add a first-class Notes module with board-like permissions, favorites, visibility, search, and rich text/image editing.

**Architecture:** Keep the existing Boards stack as the reference model. Add a parallel Notes entity at the database, repository, API, and UI layers so the feature feels native while reusing the same permission checks, favorites UX, modal patterns, and workspace scoping. For branding, centralize the app name in a small shared helper sourced from `NEXT_PUBLIC_APP_NAME` so user-facing titles and labels stop depending on hardcoded project names. For Docker, remove the local postgres service and keep the app pointed at an external `POSTGRES_URL`.

**Tech Stack:** Next.js, tRPC, Drizzle ORM, PostgreSQL, Better Auth, Tiptap/ProseMirror, Tailwind CSS, Lingui, Docker Compose.

---

### Task 1: Centralize runtime branding

**Files:**
- Modify: `apps/web/src/env.ts`
- Create: `apps/web/src/utils/branding.ts`
- Modify: `apps/web/src/components/PageHead.tsx`
- Modify: `apps/web/src/pages/_app.tsx`
- Modify: `apps/web/src/components/SideNavigation.tsx`
- Modify: `apps/web/src/components/WorkspaceMenu.tsx`
- Modify: `apps/web/src/views/home/index.tsx`
- Modify: `apps/web/src/views/home/components/Header.tsx`
- Modify: `apps/web/src/views/home/components/Footer.tsx`
- Modify: `apps/web/src/pages/404.tsx`
- Modify: `apps/web/src/pages/onboarding/select-plan.tsx`
- Modify: `apps/web/src/pages/onboarding/workspace.tsx`
- Modify: `apps/web/src/pages/partner/activate.tsx`
- Modify: `apps/web/src/views/privacy/index.tsx`
- Modify: `apps/web/src/views/terms/index.tsx`
- Modify: `apps/web/src/views/settings/components/UpdateWorkspaceUrlForm.tsx`
- Modify: `packages/email/src/templates/*.tsx`
- Modify: `README.md`
- Modify: `apps/docs/guides/self-hosting/introduction.mdx`

- [ ] **Step 1: Add a shared app-name helper backed by `NEXT_PUBLIC_APP_NAME`**

```ts
// apps/web/src/utils/branding.ts
import { env } from "next-runtime-env";

export function getAppName(): string {
  const appName = env("NEXT_PUBLIC_APP_NAME");

  if (!appName) {
    throw new Error("NEXT_PUBLIC_APP_NAME is required");
  }

  return appName;
}
```

- [ ] **Step 2: Make the env schema require the client-side app name**

```ts
// apps/web/src/env.ts
client: {
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_KAN_ENV: z.string().optional(),
  NEXT_PUBLIC_UMAMI_ID: z.string().optional(),
  // keep existing fields
},
experimental__runtimeEnv: {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_KAN_ENV: process.env.NEXT_PUBLIC_KAN_ENV,
  // keep existing fields
},
```

- [ ] **Step 3: Replace hardcoded product titles and names with `getAppName()`**

```tsx
// Example use in apps/web/src/pages/_app.tsx and PageHead.tsx
import { getAppName } from "~/utils/branding";

export const metadata = {
  title: getAppName(),
  description: `The open source project management alternative to Trello.`,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const PageHead = ({ title }: { title: string }) => (
  <Head>
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="manifest" href="/manifest.json" />
  </Head>
);
```

- [ ] **Step 4: Update email templates and docs copy to use the runtime brand name**

```tsx
// packages/email/src/templates/magic-link.tsx
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "App";
// use appName in headings and footer text
```

- [ ] **Step 5: Verify no user-facing hardcoded brand strings remain in the app shell**

Run:
```bash
rg -n "kan\\.bn|\\bKan\\b|open source Trello alternative|Powered by kan\\.bn" apps/web packages/email README.md apps/docs
```
Expected: remaining matches are only legal/license text or places intentionally kept as plain URLs in external docs, not app UI.

### Task 2: Remove local PostgreSQL from Docker and docs

**Files:**
- Modify: `docker-compose.yml`
- Modify: `cloud/docker-compose.yml`
- Modify: `README.md`
- Modify: `apps/docs/guides/self-hosting/introduction.mdx`
- Modify: `apps/docs/guides/self-hosting/s3.mdx`
- Modify: `.env.example`

- [ ] **Step 1: Remove the `postgres` service and volume from the root compose file**

```yaml
services:
  migrate:
    image: ghcr.io/kanbn/kan-migrate:latest
    container_name: ${CONTAINER_NAME:-kan-migrate}
    networks:
      - kan-network
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      target: migrate
    environment:
      - POSTGRES_URL=${POSTGRES_URL}
    restart: "no"
    # no postgres depends_on

  web:
    # keep existing service, env, and POSTGRES_URL
    depends_on:
      migrate:
        condition: service_completed_successfully

networks:
  kan-network:
```

- [ ] **Step 2: Remove the local postgres service from the Dokploy compose file as well**

```yaml
services:
  migrator:
    # keep existing migrate service
  web:
    # keep existing web service
    depends_on:
      migrator:
        condition: service_completed_successfully
```

- [ ] **Step 3: Update the README self-hosting instructions to say external Postgres is required**

```md
The Docker Compose setup now expects an external PostgreSQL database via `POSTGRES_URL`. It no longer starts a local postgres container.
```

- [ ] **Step 4: Update the self-hosting docs to match the new compose shape**

Run:
```bash
pnpm prettier --write README.md apps/docs/guides/self-hosting/introduction.mdx apps/docs/guides/self-hosting/s3.mdx .env.example docker-compose.yml cloud/docker-compose.yml
```

- [ ] **Step 5: Verify compose config still renders**

Run:
```bash
docker compose config
docker compose -f cloud/docker-compose.yml config
```
Expected: both commands succeed and contain no `postgres` service.

### Task 3: Add Notes database schema and repository layer

**Files:**
- Create: `packages/db/src/schema/notes.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/repository/note.repo.ts`
- Modify: `packages/db/src/repository/workspace.repo.ts`
- Modify: `packages/db/src/repository/user.repo.ts` if query helpers need note counts/search
- Add migration: `packages/db/migrations/<timestamp>_create_notes.sql`
- Modify snapshot metadata under `packages/db/migrations/meta/*` as generated

- [ ] **Step 1: Define `notes`, `note_activities`, and `user_note_favorites` tables**

```ts
// packages/db/src/schema/notes.ts
export const noteVisibilityStatuses = ["private", "public"] as const;

export const notes = pgTable(
  "note",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull().default(""),
    slug: varchar("slug", { length: 255 }).notNull(),
    createdBy: uuid("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id, { onDelete: "set null" }),
    workspaceId: bigint("workspaceId", { mode: "number" }).notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    visibility: noteVisibilityEnum("visibility").notNull().default("private"),
    isArchived: boolean("isArchived").notNull().default(false),
    sourceNoteId: bigint("sourceNoteId", { mode: "number" }),
  },
  (table) => [
    index("note_visibility_idx").on(table.visibility),
    index("note_is_archived_idx").on(table.isArchived),
    uniqueIndex("unique_note_slug_per_workspace").on(table.workspaceId, table.slug).where(sql`${table.deletedAt} IS NULL`),
  ],
).enableRLS();
```

- [ ] **Step 2: Add note relations and favorites similar to boards**

```ts
export const userNoteFavorites = pgTable(
  "user_note_favorites",
  {
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    noteId: bigint("noteId", { mode: "number" }).notNull().references(() => notes.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.noteId] }),
  }),
);
```

- [ ] **Step 3: Implement repository methods for list, detail, create, update, duplicate, soft delete, and favorite toggles**

```ts
export const getAllByWorkspaceId = async (db, workspaceId, userId) => { /* favorite-first sort */ };
export const getByPublicId = async (db, notePublicId, userId) => { /* workspace + visibility checks */ };
export const create = async (db, input) => { /* slug generation + insert */ };
export const update = async (db, input) => { /* title/content/visibility/archive */ };
export const duplicate = async (db, input) => { /* copy title/content and assign new slug/publicId */ };
export const softDelete = async (db, input) => { /* deletedAt/deletedBy */ };
export const addUserFavorite = async (db, userId, noteId) => { /* upsert favorite */ };
export const removeUserFavorite = async (db, userId, noteId) => { /* delete favorite */ };
```

- [ ] **Step 4: Extend workspace search to include notes**

```ts
export const searchBoardsCardsAndNotes = async (db, workspaceId, query, limit = 20) => {
  // boards + cards + notes merged, with notes returned as type: "note"
};
```

- [ ] **Step 5: Generate and apply the migration**

Run:
```bash
cd packages/db && pnpm drizzle-kit generate --name "create_notes"
pnpm db:migrate
```
Expected: a migration is created for note tables and applied cleanly.

### Task 4: Add Notes API router and schema

**Files:**
- Create: `packages/api/src/routers/note.ts`
- Modify: `packages/api/src/root.ts`
- Modify: `packages/api/src/openapi.ts`
- Modify: `packages/api/src/schemas/note.ts`
- Modify: `packages/api/src/schemas/index.ts`
- Modify: `packages/api/src/utils/permissions.ts`
- Modify: `packages/shared/src/permissions.ts`

- [ ] **Step 1: Add `note` permissions to shared defaults and categories**

```ts
// packages/shared/src/permissions.ts
export const permissionResources = ["workspace", "board", "note", "list", "card", "comment", "member"] as const;

export const allPermissions = [
  "workspace:view",
  // existing permissions
  "note:view",
  "note:create",
  "note:edit",
  "note:delete",
];
```

- [ ] **Step 2: Add note router endpoints mirroring the board router shape**

```ts
export const noteRouter = createTRPCRouter({
  all: protectedProcedure.query(...),
  byId: protectedProcedure.query(...),
  create: protectedProcedure.mutation(...),
  update: protectedProcedure.mutation(...),
  duplicate: protectedProcedure.mutation(...),
  delete: protectedProcedure.mutation(...),
});
```

- [ ] **Step 3: Wire workspace membership and note visibility checks through existing permission helpers**

```ts
await assertPermission(ctx.db, userId, workspace.id, "note:view");
await assertCanEdit(ctx.db, userId, workspace.id, "note:edit", note.createdBy ?? null);
```

- [ ] **Step 4: Expose the router in the app router and OpenAPI tags**

```ts
// packages/api/src/root.ts
note: noteRouter,
```

```ts
// packages/api/src/openapi.ts
tags: ["Auth", "Users", "Boards", "Notes", "Lists", "Cards", ...]
```

- [ ] **Step 5: Add request/response schemas for note list/detail**

```ts
export const noteListItemSchema = z.object({
  publicId: z.string(),
  title: z.string(),
  favorite: z.boolean(),
  visibility: z.enum(["private", "public"]),
  updatedAt: z.date().nullable(),
});
```

### Task 5: Build the Notes sidebar, list page, and detail page

**Files:**
- Modify: `apps/web/src/components/SideNavigation.tsx`
- Create: `apps/web/src/pages/notes/index.tsx`
- Create: `apps/web/src/pages/notes/[noteId].tsx`
- Create: `apps/web/src/views/notes/index.tsx`
- Create: `apps/web/src/views/notes/components/NotesList.tsx`
- Create: `apps/web/src/views/notes/components/NewNoteForm.tsx`
- Create: `apps/web/src/views/notes/components/NoteDropdown.tsx`
- Create: `apps/web/src/views/notes/components/DeleteNoteConfirmation.tsx`
- Create: `apps/web/src/views/notes/components/NoteEditor.tsx`
- Modify: `apps/web/src/components/Dashboard.tsx` only if layout integration is needed

- [ ] **Step 1: Add Notes directly below Boards in the sidebar**

```ts
{
  name: t`Notes`,
  href: "/notes",
  icon: /* add matching lottie asset or reuse a clean icon */,
  keyboardShortcut: {
    type: "SEQUENCE",
    strokes: [{ key: "G" }, { key: "N" }],
    action: () => router.push("/notes"),
    group: "NAVIGATION",
    description: t`Go to notes`,
  },
}
```

- [ ] **Step 2: Create the Notes list view with favorite-first sorting and empty states**

```tsx
<Button onClick={() => openModal("NEW_NOTE")}>New</Button>
<NotesList />
<Modal isVisible={isOpen && modalContentType === "NEW_NOTE"}><NewNoteForm /></Modal>
```

- [ ] **Step 3: Build the Notes detail page around a rich editor and a compact metadata rail**

```tsx
<PageHead title={`${noteData?.title ?? t`Note`} | ${workspace.name ?? t`Workspace`}`} />
<Editor content={noteData?.content ?? ""} onChange={...} workspaceMembers={[]} enableYouTubeEmbed={false} />
```

- [ ] **Step 4: Add note favorites, duplicate, delete, and visibility actions to the dropdown**

```tsx
{
  label: isFavorite ? t`Remove from favorites` : t`Add to favorites`,
  action: handleToggleFavorite,
}
```

### Task 6: Add image-capable rich note editing and uploads

**Files:**
- Modify: `apps/web/src/components/Editor.tsx`
- Modify: `apps/web/src/components/PlainTextEditor.tsx` if needed for note title inline editing
- Create: `apps/web/src/pages/api/upload/note-attachment.ts`
- Create: `apps/web/src/pages/api/download/attachment.ts` if note rendering needs a shared helper rename/fix
- Modify: `apps/web/src/components/Tooltip.tsx` only if image upload controls need help text
- Modify: `apps/web/src/views/notes/components/NoteEditor.tsx`

- [ ] **Step 1: Add Tiptap image support with base64 or uploaded URLs**

```ts
import Image from "@tiptap/extension-image";

extensions: [
  StarterKit.configure({ /* keep existing config */ }),
  Image.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: { class: "max-w-full rounded-md" },
  }),
  Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
]
```

- [ ] **Step 2: Add paste and toolbar handling so pasted image URLs render as images**

```ts
const isImageUrl = (value: string) => /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(value);
// on paste, replace direct image URLs with editor.commands.setImage({ src: value })
```

- [ ] **Step 3: Add a note-image upload endpoint mirroring attachment upload permissions**

```ts
// authorize note:edit on the note's workspace
// upload to S3
// return a stable URL and optional metadata for insertion into the editor
```

- [ ] **Step 4: Add image upload controls to the note editor**

```tsx
<Button onClick={() => fileInput.current?.click()} iconLeft={<HiOutlinePaperClip />}>
  {t`Upload image`}
</Button>
```

- [ ] **Step 5: Verify rendered note content shows images, links, and pasted URLs**

Run a manual UI check on the note detail page and confirm:
- pasted image URL becomes an inline image
- uploaded file inserts an image node
- read-only viewing still renders the same content

### Task 7: Wire search, keyboard shortcuts, and permissions end to end

**Files:**
- Modify: `apps/web/src/components/CommandPallette.tsx`
- Modify: `apps/web/src/hooks/usePermissions.ts`
- Modify: `apps/web/src/providers/keyboard-shortcuts.tsx`
- Modify: `packages/shared/src/permissions.ts`
- Modify: `packages/api/src/routers/workspace.ts`
- Modify: `packages/api/src/schemas/workspace.ts` if search result types change

- [ ] **Step 1: Include notes in the global command palette search results**

```ts
type SearchResult =
  | { type: "board"; ... }
  | { type: "card"; ... }
  | { type: "note"; publicId: string; title: string; updatedAt: Date | null; };
```

- [ ] **Step 2: Add `canCreateNote`, `canEditNote`, and `canDeleteNote` to the permissions hook**

```ts
canCreateNote: hasPermission("note:create"),
canEditNote: hasPermission("note:edit"),
canDeleteNote: hasPermission("note:delete"),
```

- [ ] **Step 3: Add keyboard shortcuts for note navigation and new-note creation**

```ts
description: t`Create new note`,
action: () => canCreateNote && openModal("NEW_NOTE"),
```

### Task 8: Verify, typecheck, lint, and commit on `next`

**Files:**
- All files changed above

- [ ] **Step 1: Run typecheck**

Run:
```bash
pnpm typecheck
```
Expected: exit code 0.

- [ ] **Step 2: Run lint**

Run:
```bash
pnpm lint
```
Expected: exit code 0.

- [ ] **Step 3: Run targeted tests**

Run:
```bash
pnpm test
```
If the repo test suite is too broad, run the focused package tests that cover the new router and note UI paths.

- [ ] **Step 4: Confirm board behavior still works**

Manually verify:
- Boards still list, favorite, create, duplicate, delete, and open correctly
- Board visibility and workspace permission checks still gate private/public access

- [ ] **Step 5: Commit all changes to `next`**

```bash
git add .
git commit -m "feat: add notes module and runtime branding"
```

