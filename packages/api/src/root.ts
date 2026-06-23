import { attachmentRouter } from "./routers/attachment";
import { boardRouter } from "./routers/board";
import { cardRouter } from "./routers/card";
import { checklistRouter } from "./routers/checklist";
import { feedbackRouter } from "./routers/feedback";
import { healthRouter } from "./routers/health";
import { importRouter } from "./routers/import";
import { integrationRouter } from "./routers/integration";
import { labelRouter } from "./routers/label";
import { noteRouter } from "./routers/note";
import { listRouter } from "./routers/list";
import { memberRouter } from "./routers/member";
import { permissionRouter } from "./routers/permission";
import { userRouter } from "./routers/user";
import { webhookRouter } from "./routers/webhook";
import { workspaceRouter } from "./routers/workspace";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  attachment: attachmentRouter,
  board: boardRouter,
  card: cardRouter,
  checklist: checklistRouter,
  feedback: feedbackRouter,
  health: healthRouter,
  label: labelRouter,
  note: noteRouter,
  list: listRouter,
  member: memberRouter,
  import: importRouter,
  permission: permissionRouter,
  user: userRouter,
  webhook: webhookRouter,
  workspace: workspaceRouter,
  integration: integrationRouter,
});

export type AppRouter = typeof appRouter;
