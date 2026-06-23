import { relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { workspaces } from "./workspaces";

export const noteVisibilityStatuses = ["private", "public"] as const;
export type NoteVisibilityStatus = (typeof noteVisibilityStatuses)[number];
export const noteVisibilityEnum = pgEnum(
  "note_visibility",
  noteVisibilityStatuses,
);

export const notes = pgTable(
  "note",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull().default(""),
    slug: varchar("slug", { length: 255 }).notNull(),
    createdBy: uuid("createdBy").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id, {
      onDelete: "set null",
    }),
    workspaceId: bigint("workspaceId", { mode: "number" })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    visibility: noteVisibilityEnum("visibility").notNull().default("private"),
    isArchived: boolean("isArchived").notNull().default(false),
    sourceNoteId: bigint("sourceNoteId", { mode: "number" }),
  },
  (table) => [
    index("note_visibility_idx").on(table.visibility),
    index("note_is_archived_idx").on(table.isArchived),
    index("note_workspace_idx").on(table.workspaceId),
    uniqueIndex("unique_note_slug_per_workspace")
      .on(table.workspaceId, table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
).enableRLS();

export const notesRelations = relations(notes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [notes.workspaceId],
    references: [workspaces.id],
    relationName: "noteWorkspace",
  }),
  createdBy: one(users, {
    fields: [notes.createdBy],
    references: [users.id],
    relationName: "noteCreatedByUser",
  }),
  deletedBy: one(users, {
    fields: [notes.deletedBy],
    references: [users.id],
    relationName: "noteDeletedByUser",
  }),
  userFavorites: many(userNoteFavorites),
}));

export const userNoteFavorites = pgTable(
  "user_note_favorites",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: bigint("noteId", { mode: "number" })
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.noteId] }),
    userIdx: index("user_note_favorite_user_idx").on(table.userId),
    noteIdx: index("user_note_favorite_note_idx").on(table.noteId),
  }),
).enableRLS();
