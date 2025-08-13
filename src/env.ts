import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BOT_TOKEN: z.string(),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    GCP_CLIENT_EMAIL: z.string(),
    GCP_PRIVATE_KEY: z.string(),
    CUSTOM_INVITE_LINK: z.string().url().optional(),
    PERMISSIONS_INTEGER: z.coerce.number(),
    SUPPORT_SERVER_LINK: z.string().url().optional(),
    OWNER_SERVER_IDS: z.preprocess((s) => {
      if (typeof s === "string") return s.split(",");
      return [];
    }, z.array(z.string())),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
