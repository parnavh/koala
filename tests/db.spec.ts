import { Database } from "@/db";
import exp from "constants";
import { describe, beforeEach, it, expect } from "vitest";

const db = new Database();
const guildId = "1";
const channels = ["100", "101", "102"];

describe("voice config", () => {
  beforeEach(async () => {
    await db.initConfig(guildId);

    return async () => {
      await db.deleteConfig(guildId);
    };
  });

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

  it("announce disabled by default", async () => {
    const res = await db.isVoiceAnnounceEnabled(guildId, "100");
    expect(res).toBe(false);
  });

  it("enable announce - global", async () => {
    await db.voiceAnnounceEnable(guildId, "GLOBAL");
    const res = await db.isVoiceAnnounceEnabled(guildId);
    expect(res).toBe(true);
  });

  it("enable announce - enable", async () => {
    await db.voiceAnnounceEnable(guildId, "ENABLE");

    const res1 = await db.isVoiceAnnounceEnabled(guildId, "100");
    expect(res1).toBe(false);

    await db.setVoiceAnnounceChannel(guildId, channels);
    const res2 = await db.isVoiceAnnounceEnabled(guildId, "100");
    const res3 = await db.isVoiceAnnounceEnabled(guildId, "99");
    expect(res2).toBe(true);
    expect(res3).toBe(false);
  });

  it("enable announce - disable", async () => {
    await db.voiceAnnounceEnable(guildId, "DISABLE");

    const res1 = await db.isVoiceAnnounceEnabled(guildId, "100");
    expect(res1).toBe(true);

    await db.setVoiceAnnounceChannel(guildId, channels);
    const res2 = await db.isVoiceAnnounceEnabled(guildId, "100");
    const res3 = await db.isVoiceAnnounceEnabled(guildId, "99");
    expect(res2).toBe(false);
    expect(res3).toBe(true);
  });

  it("disable announce", async () => {
    await db.voiceAnnounceEnable(guildId, "GLOBAL");
    await db.voiceAnnounceDisable(guildId);
    const result = await db.isVoiceAnnounceEnabled(guildId);
    expect(result).toBe(false);
  });
});
