import { Database } from "@/db";
import { describe, beforeEach, it, expect } from "vitest";

const db = new Database();
const guildId = "100";

describe("voice config", () => {
  it("enable module", async () => {
    await db.voiceEnable(guildId);
    const result = await db.isVoiceEnabled(guildId);
    expect(result).toBe(true);
  });

  it("disable module", async () => {
    await db.voiceEnable(guildId);
    await db.voiceDisable(guildId);
    const result = await db.isVoiceEnabled(guildId);
    expect(result).toBe(false);
  });
});
