import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

const blankable = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    KAN_ADMIN_API_KEY: blankable(z.string()),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_TRUSTED_ORIGINS: blankable(
      z.string().refine(
        (s) =>
          !s ||
          s.split(",").every((l) => z.string().url().safeParse(l).success),
      ),
    ),
    POSTGRES_URL: z.string().url(),
    TRELLO_APP_API_KEY: blankable(z.string()),
    TRELLO_APP_SECRET: blankable(z.string()),
    STRIPE_SECRET_KEY: blankable(z.string()),
    GOOGLE_CLIENT_ID: blankable(z.string()),
    GOOGLE_CLIENT_SECRET: blankable(z.string()),
    DISCORD_CLIENT_ID: blankable(z.string()),
    DISCORD_CLIENT_SECRET: blankable(z.string()),
    GITHUB_CLIENT_ID: blankable(z.string()),
    GITHUB_CLIENT_SECRET: blankable(z.string()),
    GITLAB_CLIENT_ID: blankable(z.string()),
    GITLAB_CLIENT_SECRET: blankable(z.string()),
    GITLAB_ISSUER: blankable(z.string()),
    MICROSOFT_CLIENT_ID: blankable(z.string()),
    MICROSOFT_CLIENT_SECRET: blankable(z.string()),
    TWITTER_CLIENT_ID: blankable(z.string()),
    TWITTER_CLIENT_SECRET: blankable(z.string()),
    KICK_CLIENT_ID: blankable(z.string()),
    KICK_CLIENT_SECRET: blankable(z.string()),
    ZOOM_CLIENT_ID: blankable(z.string()),
    ZOOM_CLIENT_SECRET: blankable(z.string()),
    DROPBOX_CLIENT_ID: blankable(z.string()),
    DROPBOX_CLIENT_SECRET: blankable(z.string()),
    VK_CLIENT_ID: blankable(z.string()),
    VK_CLIENT_SECRET: blankable(z.string()),
    LINKEDIN_CLIENT_ID: blankable(z.string()),
    LINKEDIN_CLIENT_SECRET: blankable(z.string()),
    NOVU_API_KEY: blankable(z.string()),
    EMAIL_UNSUBSCRIBE_SECRET: blankable(z.string()),
    // Generic OIDC Provider
    OIDC_CLIENT_ID: blankable(z.string()),
    OIDC_CLIENT_SECRET: blankable(z.string()),
    OIDC_DISCOVERY_URL: blankable(z.string()),
    REDDIT_CLIENT_ID: blankable(z.string()),
    REDDIT_CLIENT_SECRET: blankable(z.string()),
    ROBLOX_CLIENT_ID: blankable(z.string()),
    ROBLOX_CLIENT_SECRET: blankable(z.string()),
    SPOTIFY_CLIENT_ID: blankable(z.string()),
    SPOTIFY_CLIENT_SECRET: blankable(z.string()),
    TIKTOK_CLIENT_ID: blankable(z.string()),
    TIKTOK_CLIENT_SECRET: blankable(z.string()),
    TIKTOK_CLIENT_KEY: blankable(z.string()),
    TWITCH_CLIENT_ID: blankable(z.string()),
    TWITCH_CLIENT_SECRET: blankable(z.string()),
    APPLE_CLIENT_ID: blankable(z.string()),
    APPLE_CLIENT_SECRET: blankable(z.string()),
    APPLE_APP_BUNDLE_IDENTIFIER: blankable(z.string()),
    S3_ACCESS_KEY_ID: blankable(z.string()),
    S3_SECRET_ACCESS_KEY: blankable(z.string()),
    S3_REGION: blankable(z.string()),
    S3_ENDPOINT: blankable(z.string()),
    S3_FORCE_PATH_STYLE: blankable(z.string()),
    EMAIL_FROM: blankable(z.string()),
    REDIS_URL: blankable(z.string().url()),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_KAN_ENV: blankable(z.string()),
    NEXT_PUBLIC_UMAMI_ID: blankable(z.string()),
    NEXT_PUBLIC_POSTHOG_KEY: blankable(z.string()),
    NEXT_PUBLIC_POSTHOG_HOST: blankable(z.string()),
    NEXT_PUBLIC_USE_STANDALONE_OUTPUT: blankable(z.string()),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_STORAGE_URL: blankable(z.string().url()),
    NEXT_PUBLIC_AVATAR_BUCKET_NAME: blankable(z.string()),
    NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME: blankable(z.string()),
    NEXT_PUBLIC_STORAGE_DOMAIN: blankable(z.string()),
    NEXT_PUBLIC_USE_VIRTUAL_HOSTED_URLS: blankable(
      z.string().refine(
        (s) => !s || s.toLowerCase() === "true" || s.toLowerCase() === "false",
      ),
    ),
    NEXT_PUBLIC_APP_VERSION: blankable(z.string()),
    NEXT_PUBLIC_ALLOW_CREDENTIALS: blankable(
      z.string().refine(
        (s) => !s || s.toLowerCase() === "true" || s.toLowerCase() === "false",
      ),
    ),
    NEXT_PUBLIC_DISABLE_SIGN_UP: blankable(
      z.string().refine(
        (s) => !s || s.toLowerCase() === "true" || s.toLowerCase() === "false",
      ),
    ),
    NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY: blankable(
      z.string().refine(
        (s) => !s || s.toLowerCase() === "true" || s.toLowerCase() === "false",
      ),
    ),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_KAN_ENV: process.env.NEXT_PUBLIC_KAN_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_UMAMI_ID: process.env.NEXT_PUBLIC_UMAMI_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
    NEXT_PUBLIC_AVATAR_BUCKET_NAME: process.env.NEXT_PUBLIC_AVATAR_BUCKET_NAME,
    NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME:
      process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME,
    NEXT_PUBLIC_STORAGE_DOMAIN: process.env.NEXT_PUBLIC_STORAGE_DOMAIN,
    NEXT_PUBLIC_USE_VIRTUAL_HOSTED_URLS:
      process.env.NEXT_PUBLIC_USE_VIRTUAL_HOSTED_URLS,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ALLOW_CREDENTIALS: process.env.NEXT_PUBLIC_ALLOW_CREDENTIALS,
    NEXT_PUBLIC_DISABLE_SIGN_UP: process.env.NEXT_PUBLIC_DISABLE_SIGN_UP,
    NEXT_PUBLIC_USE_STANDALONE_OUTPUT:
      process.env.NEXT_PUBLIC_USE_STANDALONE_OUTPUT,
    NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY:
      process.env.NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
