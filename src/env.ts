import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BOT_TOKEN: z.string(),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    GCP_KEY: z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({ code: "custom", message: "Invalid JSON" });
        return z.NEVER;
      }
    }),
    CUSTOM_INVITE_LINK: z.string().url().optional(),
    PERMISSIONS_INTEGER: z.coerce.number(),
    SUPPORT_SERVER_LINK: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
