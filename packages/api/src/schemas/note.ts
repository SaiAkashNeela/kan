import { z } from "zod";

import { workspaceMemberSchema } from "./common";

export const noteListItemSchema = z.object({
  publicId: z.string(),
  title: z.string(),
  slug: z.string(),
  favorite: z.boolean(),
  visibility: z.enum(["private", "public"]),
  isArchived: z.boolean(),
  updatedAt: z.date().nullable().optional(),
  createdAt: z.date().nullable().optional(),
});

export const noteDetailSchema = z.object({
  publicId: z.string(),
  title: z.string(),
  content: z.string(),
  slug: z.string(),
  visibility: z.enum(["private", "public"]),
  isArchived: z.boolean(),
  favorite: z.boolean(),
  workspace: z.object({
    publicId: z.string(),
    name: z.string(),
    slug: z.string(),
    members: z.array(workspaceMemberSchema),
  }),
});

export const noteBySlugSchema = z.object({
  publicId: z.string(),
  title: z.string(),
  content: z.string(),
  slug: z.string(),
  visibility: z.enum(["private", "public"]),
  isArchived: z.boolean(),
  favorite: z.boolean(),
  workspace: z.object({
    publicId: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
});

export const noteCreateResponseSchema = z.object({
  publicId: z.string(),
  title: z.string(),
  slug: z.string(),
});

export const noteUpdateResponseSchema = z.union([
  z.object({ success: z.boolean() }),
  z.object({
    publicId: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
]);
