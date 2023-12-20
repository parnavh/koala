import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BOT_TOKEN: z.string(),
    REDIS_URL: z.string(),
    AZURE_SPEECH_KEY: z.string(),
    AZURE_SPEECH_REGION: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
