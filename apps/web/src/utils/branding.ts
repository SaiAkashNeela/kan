import { env } from "next-runtime-env";

export function getAppName() {
  const appName = env("NEXT_PUBLIC_APP_NAME");

  if (!appName) {
    throw new Error("NEXT_PUBLIC_APP_NAME is required");
  }

  return appName;
}

export function getBaseUrl() {
  const baseUrl = env("NEXT_PUBLIC_BASE_URL");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is required");
  }

  return baseUrl;
}
