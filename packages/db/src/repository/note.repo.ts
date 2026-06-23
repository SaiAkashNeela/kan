import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import type { NoteVisibilityStatus } from "@kan/db/schema";
import {
  notes,
  userNoteFavorites,
  workspaceMembers,
} from "@kan/db/schema";
import { generateUID } from "@kan/shared/utils";

export const getCount = async (db: dbClient) => {
  const result = await db
    .select({ count: count() })
    .from(notes)
    .where(isNull(notes.deletedAt));

  return result[0]?.count ?? 0;
};

export const getAllByWorkspaceId = async (
  db: dbClient,
  workspaceId: number,
  userId: string,
  opts?: { archived?: boolean },
) => {
  const notesData = await db.query.notes.findMany({
    columns: {
      publicId: true,
      title: true,
      slug: true,
      visibility: true,
      isArchived: true,
      updatedAt: true,
      createdAt: true,
    },
    with: {
      userFavorites: {
        where: eq(userNoteFavorites.userId, userId),
        columns: {
          userId: true,
        },
      },
    },
    where: and(
      eq(notes.workspaceId, workspaceId),
      isNull(notes.deletedAt),
      opts?.archived !== undefined ? eq(notes.isArchived, opts.archived) : undefined,
    ),
    orderBy: [desc(notes.updatedAt), asc(notes.title)],
  });

  return notesData
    .map((note) => ({
      ...note,
      favorite: note.userFavorites.length > 0,
      userFavorites: undefined,
    }))
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return a.title.localeCompare(b.title);
    });
};

export const searchByWorkspaceId = async (
  db: dbClient,
  workspaceId: number,
  userId: string,
  query: string,
  limit = 20,
) => {
  const searchQuery = `%${query}%`;

  const results = await db.query.notes.findMany({
    columns: {
      publicId: true,
      title: true,
      slug: true,
      visibility: true,
      isArchived: true,
      updatedAt: true,
      createdAt: true,
    },
    with: {
      userFavorites: {
        where: eq(userNoteFavorites.userId, userId),
        columns: {
          userId: true,
        },
      },
    },
    where: and(
      eq(notes.workspaceId, workspaceId),
      isNull(notes.deletedAt),
      or(
        ilike(notes.title, searchQuery),
        ilike(notes.content, searchQuery),
        sql`similarity(${notes.title}, ${query}) > 0.2`,
        sql`similarity(${notes.content}, ${query}) > 0.15`,
      ),
    ),
    orderBy: [
      sql`CASE WHEN ${notes.title} ILIKE ${searchQuery} THEN 1 ELSE 0 END DESC`,
      sql`similarity(${notes.title}, ${query}) DESC`,
      desc(notes.updatedAt),
    ],
    limit,
  });

  return results
    .map((note) => ({
      ...note,
      favorite: note.userFavorites.length > 0,
      userFavorites: undefined,
    }))
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    });
};

export const getByPublicId = async (
  db: dbClient,
  notePublicId: string,
  userId: string,
) => {
  const note = await db.query.notes.findFirst({
    columns: {
      id: true,
      publicId: true,
      title: true,
      content: true,
      slug: true,
      visibility: true,
      isArchived: true,
      workspaceId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      userFavorites: {
        where: eq(userNoteFavorites.userId, userId),
        columns: {
          userId: true,
        },
      },
      workspace: {
        columns: {
          publicId: true,
          name: true,
          slug: true,
        },
        with: {
          members: {
            columns: {
              publicId: true,
              email: true,
              status: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            where: isNull(workspaceMembers.deletedAt),
          },
        },
      },
    },
    where: and(
      eq(notes.publicId, notePublicId),
      isNull(notes.deletedAt),
    ),
  });

  if (!note) return null;

  return {
    ...note,
    favorite: note.userFavorites.length > 0,
    userFavorites: undefined,
  };
};

export const getBySlug = async (
  db: dbClient,
  noteSlug: string,
  workspaceId: number,
  userId: string,
) => {
  const note = await db.query.notes.findFirst({
    columns: {
      id: true,
      publicId: true,
      title: true,
      content: true,
      slug: true,
      visibility: true,
      isArchived: true,
      workspaceId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      userFavorites: {
        where: eq(userNoteFavorites.userId, userId),
        columns: {
          userId: true,
        },
      },
      workspace: {
        columns: {
          publicId: true,
          name: true,
          slug: true,
        },
      },
    },
    where: and(
      eq(notes.slug, noteSlug),
      eq(notes.workspaceId, workspaceId),
      eq(notes.visibility, "public"),
      isNull(notes.deletedAt),
    ),
  });

  if (!note) return null;

  return {
    ...note,
    favorite: note.userFavorites.length > 0,
    userFavorites: undefined,
  };
};

export const getWorkspaceAndNoteIdByNotePublicId = async (
  db: dbClient,
  notePublicId: string,
) => {
  const result = await db.query.notes.findFirst({
    columns: {
      id: true,
      workspaceId: true,
      createdBy: true,
    },
    where: eq(notes.publicId, notePublicId),
  });

  return result;
};

export const isSlugUnique = async (
  db: dbClient,
  args: { slug: string; workspaceId: number },
) => {
  const result = await db.query.notes.findFirst({
    columns: {
      slug: true,
    },
    where: and(
      eq(notes.slug, args.slug),
      eq(notes.workspaceId, args.workspaceId),
      isNull(notes.deletedAt),
    ),
  });

  return result === undefined;
};

export const create = async (
  db: dbClient,
  noteInput: {
    publicId?: string;
    title: string;
    content?: string;
    createdBy: string;
    workspaceId: number;
    slug: string;
    visibility?: NoteVisibilityStatus;
    sourceNoteId?: number;
  },
) => {
  const [result] = await db
    .insert(notes)
    .values({
      publicId: noteInput.publicId ?? generateUID(),
      title: noteInput.title,
      content: noteInput.content ?? "",
      createdBy: noteInput.createdBy,
      workspaceId: noteInput.workspaceId,
      slug: noteInput.slug,
      visibility: noteInput.visibility ?? "private",
      sourceNoteId: noteInput.sourceNoteId,
    })
    .returning({
      id: notes.id,
      publicId: notes.publicId,
      title: notes.title,
      slug: notes.slug,
      content: notes.content,
      visibility: notes.visibility,
    });

  return result;
};

export const update = async (
  db: dbClient,
  noteInput: {
    notePublicId: string;
    title?: string;
    content?: string;
    slug?: string;
    visibility?: NoteVisibilityStatus;
    isArchived?: boolean;
  },
) => {
  const [result] = await db
    .update(notes)
    .set({
      title: noteInput.title,
      content: noteInput.content,
      slug: noteInput.slug,
      visibility: noteInput.visibility,
      updatedAt: new Date(),
      ...(noteInput.isArchived !== undefined && { isArchived: noteInput.isArchived }),
    })
    .where(eq(notes.publicId, noteInput.notePublicId))
    .returning({
      publicId: notes.publicId,
      title: notes.title,
      content: notes.content,
      slug: notes.slug,
    });

  return result;
};

export const softDelete = async (
  db: dbClient,
  args: {
    noteId: number;
    deletedAt: Date;
    deletedBy: string;
  },
) => {
  const [result] = await db
    .update(notes)
    .set({ deletedAt: args.deletedAt, deletedBy: args.deletedBy })
    .where(and(eq(notes.id, args.noteId), isNull(notes.deletedAt)))
    .returning({
      publicId: notes.publicId,
      title: notes.title,
    });

  return result;
};

export const addUserFavorite = async (
  db: dbClient,
  userId: string,
  noteId: number,
) => {
  return db
    .insert(userNoteFavorites)
    .values({
      userId,
      noteId,
    })
    .onConflictDoNothing()
    .returning();
};

export const removeUserFavorite = async (
  db: dbClient,
  userId: string,
  noteId: number,
) => {
  return db
    .delete(userNoteFavorites)
    .where(
      and(eq(userNoteFavorites.userId, userId), eq(userNoteFavorites.noteId, noteId)),
    )
    .returning();
};
