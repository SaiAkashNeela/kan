CREATE TYPE "public"."note_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "note" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"publicId" varchar(12) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"slug" varchar(255) NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"deletedBy" uuid,
	"workspaceId" bigint NOT NULL,
	"visibility" "note_visibility" DEFAULT 'private' NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"sourceNoteId" bigint,
	CONSTRAINT "note_publicId_unique" UNIQUE("publicId")
);
--> statement-breakpoint
ALTER TABLE "note" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_note_favorites" (
	"userId" uuid NOT NULL,
	"noteId" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_note_favorites_userId_noteId_pk" PRIMARY KEY("userId","noteId")
);
--> statement-breakpoint
ALTER TABLE "user_note_favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note" ADD CONSTRAINT "note_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note" ADD CONSTRAINT "note_deletedBy_user_id_fk" FOREIGN KEY ("deletedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note" ADD CONSTRAINT "note_workspaceId_workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_note_favorites" ADD CONSTRAINT "user_note_favorites_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_note_favorites" ADD CONSTRAINT "user_note_favorites_noteId_note_id_fk" FOREIGN KEY ("noteId") REFERENCES "public"."note"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_visibility_idx" ON "note" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_is_archived_idx" ON "note" USING btree ("isArchived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_workspace_idx" ON "note" USING btree ("workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_note_slug_per_workspace" ON "note" USING btree ("workspaceId","slug") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_note_favorite_user_idx" ON "user_note_favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_note_favorite_note_idx" ON "user_note_favorites" USING btree ("noteId");
