import { env } from "next-runtime-env";
import { generateOpenApiDocument } from "trpc-to-openapi";

import { appRouter } from "./root";

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: `${env("NEXT_PUBLIC_APP_NAME")} API`,
  description: "OpenAPI compliant REST API",
  version: "1.0.0",
  baseUrl: `${env("NEXT_PUBLIC_BASE_URL")}/api/v1`,
  docsUrl: `${env("NEXT_PUBLIC_BASE_URL")}/docs`,
  tags: [
    "Auth",
    "Users",
    "Boards",
    "Notes",
    "Lists",
    "Cards",
    "Labels",
    "Imports",
    "Integrations",
    "Health",
  ],
});
