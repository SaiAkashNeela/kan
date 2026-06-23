import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as noteRepo from "@kan/db/repository/note.repo";
import * as workspaceRepo from "@kan/db/repository/workspace.repo";
import { generateSlug, generateUID } from "@kan/shared/utils";

import {
  noteBySlugSchema,
  noteCreateResponseSchema,
  noteDetailSchema,
  noteListItemSchema,
  noteUpdateResponseSchema,
} from "../schemas";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { assertCanDelete, assertCanEdit, assertPermission } from "../utils/permissions";

export const noteRouter = createTRPCRouter({
  all: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/workspaces/{workspacePublicId}/notes",
        summary: "Get all notes",
        description: "Retrieves all notes for a given workspace",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(
      z.object({
        workspacePublicId: z.string().min(12),
        archived: z.boolean().optional(),
        search: z.string().trim().min(1).optional(),
      }),
    )
    .output(z.array(noteListItemSchema))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        input.workspacePublicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${input.workspacePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, workspace.id, "note:view");

      if (input.search) {
        return noteRepo.searchByWorkspaceId(
          ctx.db,
          workspace.id,
          userId,
          input.search,
        );
      }

      return noteRepo.getAllByWorkspaceId(ctx.db, workspace.id, userId, {
        archived: input.archived ?? false,
      });
    }),
  byId: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/notes/{notePublicId}",
        summary: "Get note by public ID",
        description: "Retrieves a note by its public ID",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(z.object({ notePublicId: z.string().min(12) }))
    .output(noteDetailSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const note = await noteRepo.getByPublicId(
        ctx.db,
        input.notePublicId,
        userId,
      );

      if (!note)
        throw new TRPCError({
          message: `Note with public ID ${input.notePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, note.workspaceId, "note:view");

      return note;
    }),
  bySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/workspaces/{workspaceSlug}/notes/{noteSlug}",
        summary: "Get note by slug",
        description: "Retrieves a public note by slug within a workspace",
        tags: ["Notes"],
        protect: false,
      },
    })
    .input(
      z.object({
        workspaceSlug: z
          .string()
          .min(3)
          .max(64)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/),
        noteSlug: z
          .string()
          .min(3)
          .max(60)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/),
      }),
    )
    .output(noteBySlugSchema.nullable())
    .query(async ({ ctx, input }) => {
      const workspace = await workspaceRepo.getBySlugWithBoards(
        ctx.db,
        input.workspaceSlug,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with slug ${input.workspaceSlug} not found`,
          code: "NOT_FOUND",
        });

      const note = await noteRepo.getBySlug(
        ctx.db,
        input.noteSlug,
        workspace.id,
        ctx.user?.id ?? "",
      );

      return note;
    }),
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/workspaces/{workspacePublicId}/notes",
        summary: "Create note",
        description: "Creates a note for a workspace",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(
      z.object({
        workspacePublicId: z.string().min(12),
        title: z.string().min(1).max(255),
        content: z.string().optional(),
        visibility: z.enum(["private", "public"]).optional(),
      }),
    )
    .output(noteCreateResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        input.workspacePublicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${input.workspacePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, workspace.id, "note:create");

      let slug = generateSlug(input.title) || generateUID();
      const isSlugUnique = await noteRepo.isSlugUnique(ctx.db, {
        slug,
        workspaceId: workspace.id,
      });

      if (!isSlugUnique) slug = `${slug}-${generateUID()}`;

      const note = await noteRepo.create(ctx.db, {
        publicId: generateUID(),
        title: input.title,
        content: input.content ?? "",
        createdBy: userId,
        workspaceId: workspace.id,
        slug,
        visibility: input.visibility ?? "private",
      });

      if (!note)
        throw new TRPCError({
          message: `Failed to create note`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return note;
    }),
  duplicate: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/notes/{notePublicId}/duplicate",
        summary: "Duplicate note",
        description: "Duplicates a note into the same workspace",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(
      z.object({
        notePublicId: z.string().min(12),
        title: z.string().min(1).max(255).optional(),
      }),
    )
    .output(noteCreateResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const source = await noteRepo.getByPublicId(
        ctx.db,
        input.notePublicId,
        userId,
      );

      if (!source)
        throw new TRPCError({
          message: `Note with public ID ${input.notePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, source.workspaceId, "note:create");

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        source.workspace.publicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${source.workspace.publicId} not found`,
          code: "NOT_FOUND",
        });

      let slug = generateSlug(input.title ?? `Copy of ${source.title}`) || generateUID();
      const isSlugUnique = await noteRepo.isSlugUnique(ctx.db, {
        slug,
        workspaceId: workspace.id,
      });

      if (!isSlugUnique) slug = `${slug}-${generateUID()}`;

      const note = await noteRepo.create(ctx.db, {
        publicId: generateUID(),
        title: input.title ?? `Copy of ${source.title}`,
        content: source.content,
        createdBy: userId,
        workspaceId: workspace.id,
        slug,
        visibility: source.visibility,
        sourceNoteId: source.id,
      });

      if (!note)
        throw new TRPCError({
          message: `Failed to duplicate note`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return note;
    }),
  update: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/notes/{notePublicId}",
        summary: "Update note",
        description: "Updates a note by its public ID",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(
      z.object({
        notePublicId: z.string().min(12),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        slug: z
          .string()
          .min(3)
          .max(60)
          .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/)
          .optional(),
        visibility: z.enum(["private", "public"]).optional(),
        favorite: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      }),
    )
    .output(noteUpdateResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const note = await noteRepo.getWorkspaceAndNoteIdByNotePublicId(
        ctx.db,
        input.notePublicId,
      );

      if (!note)
        throw new TRPCError({
          message: `Note with public ID ${input.notePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertCanEdit(
        ctx.db,
        userId,
        note.workspaceId,
        "note:edit",
        note.createdBy ?? null,
      );

      if (input.favorite !== undefined) {
        if (input.favorite) {
          await noteRepo.addUserFavorite(ctx.db, userId, note.id);
        } else {
          await noteRepo.removeUserFavorite(ctx.db, userId, note.id);
        }
      }

      const hasOtherUpdates =
        input.title ||
        input.content !== undefined ||
        input.slug ||
        input.visibility !== undefined ||
        input.isArchived !== undefined;

      if (!hasOtherUpdates) {
        return { success: true };
      }

      if (input.slug) {
        const isSlugUnique = await noteRepo.isSlugUnique(ctx.db, {
          slug: input.slug,
          workspaceId: note.workspaceId,
        });

        if (!isSlugUnique) {
          throw new TRPCError({
            message: `Note slug ${input.slug} is not available`,
            code: "BAD_REQUEST",
          });
        }
      }

      const result = await noteRepo.update(ctx.db, {
        notePublicId: input.notePublicId,
        title: input.title,
        content: input.content,
        slug: input.slug,
        visibility: input.visibility,
        isArchived: input.isArchived,
      });

      if (!result)
        throw new TRPCError({
          message: `Failed to update note`,
          code: "INTERNAL_SERVER_ERROR",
        });

      return result;
    }),
  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/notes/{notePublicId}",
        summary: "Delete note",
        description: "Deletes a note by its public ID",
        tags: ["Notes"],
        protect: true,
      },
    })
    .input(z.object({ notePublicId: z.string().min(12) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const note = await noteRepo.getWorkspaceAndNoteIdByNotePublicId(
        ctx.db,
        input.notePublicId,
      );

      if (!note)
        throw new TRPCError({
          message: `Note with public ID ${input.notePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertCanDelete(
        ctx.db,
        userId,
        note.workspaceId,
        "note:delete",
        note.createdBy ?? null,
      );

      const deletedAt = new Date();

      await noteRepo.softDelete(ctx.db, {
        noteId: note.id,
        deletedAt,
        deletedBy: userId,
      });

      return { success: true };
    }),
});
