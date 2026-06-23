import Link from "next/link";
import { useRouter } from "next/router";
import { t } from "@lingui/core/macro";
import { keepPreviousData } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import {
  HiOutlineDocumentDuplicate,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlinePlusSmall,
  HiOutlineStar,
  HiStar,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "~/components/Button";
import Dropdown from "~/components/Dropdown";
import Editor from "~/components/Editor";
import type { WorkspaceMember } from "~/components/Editor";
import Input from "~/components/Input";
import Modal from "~/components/modal";
import { PageHead } from "~/components/PageHead";
import { Tooltip } from "~/components/Tooltip";
import { usePermissions } from "~/hooks/usePermissions";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { WorkspaceContext, useWorkspace } from "~/providers/workspace";
import { api } from "~/utils/api";

const tabs = [
  { key: "active" as const, label: t`Active` },
  { key: "archived" as const, label: t`Archived` },
];

function NoteCard({
  note,
  onToggleFavorite,
}: {
  note: {
    publicId: string;
    title: string;
    slug: string;
    favorite: boolean;
    visibility: "private" | "public";
    isArchived: boolean;
    updatedAt?: Date | null;
    createdAt?: Date | null;
  };
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group rounded-md border border-light-300 bg-light-50 p-4 shadow-sm transition hover:border-light-400 hover:bg-light-100 dark:border-dark-300 dark:bg-dark-50 dark:hover:border-dark-200 dark:hover:bg-dark-100">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/notes/${note.publicId}`} className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-light-1000 dark:text-dark-1000">
            {note.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-xs text-light-900 dark:text-dark-900">
            {note.visibility === "public" ? t`Public` : t`Private`}
            {note.isArchived ? ` · ${t`Archived`}` : ""}
          </p>
        </Link>
        <button
          type="button"
          onClick={onToggleFavorite}
          className="rounded p-1 text-light-900 opacity-0 transition group-hover:opacity-100 hover:bg-light-200 dark:text-dark-900 dark:hover:bg-dark-200"
          aria-label={note.favorite ? t`Unfavorite note` : t`Favorite note`}
        >
          {note.favorite ? <HiStar className="h-4 w-4" /> : <HiOutlineStar className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-light-900 dark:text-dark-900">
        <span>{note.slug}</span>
        <span>{note.updatedAt?.toLocaleDateString() ?? note.createdAt?.toLocaleDateString() ?? ""}</span>
      </div>
    </div>
  );
}

function NewNoteModal() {
  const { workspace } = useWorkspace();
  const { closeModal } = useModal();
  const { showPopup } = usePopup();
  const utils = api.useUtils();
  const router = useRouter();

  const schema = z.object({
    title: z.string().min(1).max(255),
  });

  const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
    values: { title: "" },
  });

  const createNote = api.note.create.useMutation({
    onSuccess: async (data) => {
      await utils.note.all.invalidate({ workspacePublicId: workspace.publicId });
      closeModal();
      await router.push(`/notes/${data.publicId}`);
    },
    onError: () => {
      showPopup({
        header: t`Unable to create note`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        createNote.mutate({
          workspacePublicId: workspace.publicId,
          title: values.title,
        });
      })}
    >
      <div className="px-5 pt-5">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-dark-1000">
          {t`New note`}
        </h2>
        <div className="mt-4">
          <Input {...register("title")} placeholder={t`Note title`} />
        </div>
      </div>
      <div className="mt-8 flex items-center justify-end border-t border-light-600 px-5 py-5 dark:border-dark-600">
        <Button type="submit" isLoading={createNote.isPending}>
          {t`Create`}
        </Button>
      </div>
    </form>
  );
}

function DeleteNoteModal({
  notePublicId,
  noteTitle,
}: {
  notePublicId: string;
  noteTitle: string;
}) {
  const { closeModal } = useModal();
  const { showPopup } = usePopup();
  const utils = api.useUtils();
  const router = useRouter();

  const deleteNote = api.note.delete.useMutation({
    onSuccess: async () => {
      await utils.note.all.invalidate();
      await utils.note.byId.invalidate({ notePublicId });
      closeModal();
      await router.push("/notes");
    },
    onError: () => {
      showPopup({
        header: t`Unable to delete note`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
  });

  return (
    <div className="px-5 py-5">
      <h2 className="text-sm font-bold text-neutral-900 dark:text-dark-1000">
        {t`Delete note`}
      </h2>
      <p className="mt-2 text-sm text-light-900 dark:text-dark-900">
        {t`This will permanently delete “${noteTitle}”.`}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={closeModal}>
          {t`Cancel`}
        </Button>
        <Button
          variant="danger"
          isLoading={deleteNote.isPending}
          onClick={() => deleteNote.mutate({ notePublicId })}
        >
          {t`Delete`}
        </Button>
      </div>
    </div>
  );
}

export function NotesView() {
  const { workspace } = useWorkspace();
  const { openModal, modalContentType, isOpen, entityId } = useModal();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const utils = api.useUtils();
  const { hasPermission } = usePermissions();
  const canCreateNote = hasPermission("note:create");

  const notesQuery = api.note.all.useQuery(
    {
      workspacePublicId: workspace.publicId,
      archived: activeTab === "archived",
      search: search.trim() || undefined,
    },
    {
      enabled: !!workspace.publicId,
      placeholderData: keepPreviousData,
    },
  );

  const updateNote = api.note.update.useMutation({
    onSettled: async () => {
      await utils.note.all.invalidate();
      await utils.note.byId.invalidate();
      await utils.note.bySlug.invalidate();
    },
  });

  const notes = notesQuery.data ?? [];

  return (
    <>
      <PageHead title={t`Notes | ${workspace.name ?? t`Workspace`}`} />
      <div className="m-auto h-full max-w-[1100px] p-8 px-5 md:px-28 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
              {t`Notes`}
            </h1>
            <p className="mt-1 text-sm text-light-900 dark:text-dark-900">
              {t`Workspace notes with rich text and images.`}
            </p>
          </div>
          <Tooltip content={!canCreateNote ? t`You don't have permission` : undefined}>
            <Button
              type="button"
              variant="primary"
              onClick={() => canCreateNote && openModal("NEW_NOTE")}
              iconLeft={<HiOutlinePlusSmall className="h-4 w-4" aria-hidden="true" />}
            >
              {t`New`}
            </Button>
          </Tooltip>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.key
                    ? "bg-light-200 text-light-1000 dark:bg-dark-200 dark:text-dark-1000"
                    : "text-light-900 hover:bg-light-200 dark:text-dark-900 dark:hover:bg-dark-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t`Search notes`}
            className="max-w-md"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.publicId}
              note={note}
              onToggleFavorite={() => {
                updateNote.mutate({
                  notePublicId: note.publicId,
                  favorite: !note.favorite,
                });
              }}
            />
          ))}
        </div>

        {notes.length === 0 && !notesQuery.isLoading && (
          <div className="mt-16 rounded-md border border-dashed border-light-300 p-10 text-center text-sm text-light-900 dark:border-dark-300 dark:text-dark-900">
            {t`No notes yet.`}
          </div>
        )}

        <Modal modalSize="sm" isVisible={isOpen && modalContentType === "NEW_NOTE"}>
          <NewNoteModal />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "DELETE_NOTE"}
        >
          <DeleteNoteModal
            notePublicId={entityId ?? ""}
            noteTitle={notes.find((note) => note.publicId === entityId)?.title ?? t`this note`}
          />
        </Modal>
      </div>
    </>
  );
}

function NoteActions({
  note,
  canEdit,
  canDelete,
  isPublicRoute = false,
  onToggleFavorite,
  onDuplicate,
  onArchiveToggle,
  onDelete,
}: {
  note: {
    publicId: string;
    title: string;
    favorite: boolean;
    isArchived: boolean;
    visibility: "private" | "public";
  };
  canEdit: boolean;
  canDelete: boolean;
  isPublicRoute?: boolean;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  if (isPublicRoute) return null;

  return (
    <Dropdown
      items={[
        {
          label: note.favorite ? t`Remove from favorites` : t`Add to favorites`,
          action: onToggleFavorite,
          icon: note.favorite ? <HiStar className="h-4 w-4" /> : <HiOutlineStar className="h-4 w-4" />,
        },
        {
          label: t`Duplicate note`,
          action: onDuplicate,
          icon: <HiOutlineDocumentDuplicate className="h-4 w-4" />,
          disabled: !canEdit,
        },
        {
          label: note.isArchived ? t`Unarchive note` : t`Archive note`,
          action: onArchiveToggle,
          icon: note.isArchived ? <HiOutlineEye className="h-4 w-4" /> : <HiOutlineEyeSlash className="h-4 w-4" />,
          disabled: !canEdit,
        },
        {
          label: t`Delete note`,
          action: onDelete,
          icon: <HiOutlineTrash className="h-4 w-4" />,
          disabled: !canDelete,
        },
      ]}
    >
      <span className="text-lg leading-none">⋯</span>
    </Dropdown>
  );
}

export function NoteView({
  publicMode = false,
}: {
  publicMode?: boolean;
}) {
  const router = useRouter();
  const workspaceContext = useContext(WorkspaceContext);
  const workspace = workspaceContext?.workspace;
  const utils = api.useUtils();
  const { openModal, modalContentType, isOpen, entityId } = useModal();
  const { showPopup } = usePopup();
  const { hasPermission } = usePermissions();

  const noteId = Array.isArray(router.query.noteId)
    ? router.query.noteId[0]
    : router.query.noteId;
  const noteSlug = Array.isArray(router.query.noteSlug)
    ? router.query.noteSlug[0]
    : router.query.noteSlug;
  const workspaceSlug = Array.isArray(router.query.workspaceSlug)
    ? router.query.workspaceSlug[0]
    : router.query.workspaceSlug;

  const detailQuery = publicMode
    ? api.note.bySlug.useQuery(
        {
          workspaceSlug: workspaceSlug ?? "",
          noteSlug: noteSlug ?? "",
        },
        { enabled: router.isReady && !!workspaceSlug && !!noteSlug },
      )
    : api.note.byId.useQuery(
        {
          notePublicId: noteId ?? "",
        },
        { enabled: router.isReady && !!noteId },
      );

  const note = detailQuery.data ?? null;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.publicId]);

  const updateNote = api.note.update.useMutation({
    onSuccess: async (data) => {
      await utils.note.byId.invalidate();
      await utils.note.bySlug.invalidate();
      await utils.note.all.invalidate();

      if (!publicMode && "publicId" in data && data.publicId !== note?.publicId) {
        await router.replace(`/notes/${data.publicId}`);
      }
    },
    onError: () => {
      showPopup({
        header: t`Unable to update note`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
  });

  const duplicateNote = api.note.duplicate.useMutation({
    onSuccess: async (data) => {
      await utils.note.all.invalidate();
      await router.push(`/notes/${data.publicId}`);
    },
    onError: () => {
      showPopup({
        header: t`Unable to duplicate note`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
  });

  const canEdit = !publicMode && hasPermission("note:edit");
  const canDelete = !publicMode && hasPermission("note:delete");
  const workspaceMembers =
    !publicMode && note && "members" in note.workspace
      ? (note.workspace.members as WorkspaceMember[])
      : [];

  useEffect(() => {
    if (router.isReady && !detailQuery.isLoading && !note && detailQuery.error?.data?.code === "NOT_FOUND") {
      router.replace("/404");
    }
  }, [router, note, detailQuery.isLoading, detailQuery.error, publicMode]);

  const save = (next?: { title?: string; content?: string }) => {
    if (!note) return;

    updateNote.mutate({
      notePublicId: note.publicId,
      title: next?.title ?? title,
      content: next?.content ?? content,
    });
  };

  const handleFavorite = () => {
    if (!note) return;
    updateNote.mutate({
      notePublicId: note.publicId,
      favorite: !note.favorite,
    });
  };

  const handleArchiveToggle = () => {
    if (!note) return;
    updateNote.mutate({
      notePublicId: note.publicId,
      isArchived: !note.isArchived,
    });
  };

  return (
    <>
      <PageHead title={`${note?.title ?? t`Note`} | ${note?.workspace.name ?? workspace?.name ?? t`Workspace`}`} />
      <div className="m-auto h-full max-w-[1100px] p-8 px-5 md:px-28 md:py-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (note && title !== note.title) {
                  save({ title });
                }
              }}
              className="border-0 bg-transparent px-0 text-2xl font-bold shadow-none ring-0 focus:ring-0"
              placeholder={t`Untitled note`}
              disabled={!note || publicMode}
            />
            <div className="mt-2 text-xs text-light-900 dark:text-dark-900">
              {note?.visibility === "public" ? t`Public` : t`Private`}
              {note?.isArchived ? ` · ${t`Archived`}` : ""}
            </div>
          </div>
          {note && (
            <NoteActions
              note={note}
              canEdit={canEdit}
              canDelete={canDelete}
              isPublicRoute={publicMode}
              onToggleFavorite={handleFavorite}
              onDuplicate={() => duplicateNote.mutate({ notePublicId: note.publicId })}
              onArchiveToggle={handleArchiveToggle}
              onDelete={() => openModal("DELETE_NOTE", note.publicId)}
            />
          )}
        </div>

        <div className="rounded-md border border-light-300 bg-light-50 p-5 dark:border-dark-300 dark:bg-dark-50">
          <Editor
            content={content}
            onChange={setContent}
            onBlur={() => {
              if (note && content !== note.content) {
                save({ content });
              }
            }}
            readOnly={publicMode}
            workspaceMembers={workspaceMembers}
            enableImages
            placeholder={t`Start writing...`}
            disableHeadings={publicMode}
          />
        </div>
      </div>

      <Modal
        modalSize="sm"
        isVisible={isOpen && modalContentType === "DELETE_NOTE"}
      >
        <DeleteNoteModal
          notePublicId={entityId ?? note?.publicId ?? ""}
          noteTitle={note?.title ?? t`this note`}
        />
      </Modal>
    </>
  );
}
