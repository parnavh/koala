import { Database } from "@/db";
import { MaintenanceError } from "@/errors";
import { describe, beforeEach, it, expect } from "vitest";

const db = new Database();
const guildId = "1";
const channels = ["100", "101", "102"];

describe("voice config", () => {
  beforeEach(async () => {
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

  it("announce enabled by default", async () => {
    const res = await db.isVoiceAnnounceEnabled(guildId, "100");
    expect(res).toBe(true);
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

describe("guild metrics", () => {
  beforeEach(async () => {
    return async () => {
      await db.deleteMetrics(guildId);
    };
  });

  it("voice character usage", async () => {
    await db.metricsUpdate(guildId, 200);
    const result = await db.getMetrics(guildId);
    expect(result?.voiceCharacters).toBe(200);
  });

  it("server member count", async () => {
    await db.metricsUpdate(guildId, 30, 20);
    const result = await db.getMetrics(guildId);
    expect(result?.memberCount).toBe(20);
  });
});

describe("global flags", () => {
  beforeEach(async () => {
    return async () => {
      await db.clearMaintenanceMode();
    };
  });

  it("set maintenance mode", async () => {
    const init = await db.getMaintenanceMode();
    expect(init).toBeFalsy();

    await db.setMaintenanceMode(true);
    const res1 = await db.getMaintenanceMode();
    expect(res1).toBeTruthy();

    await db.setMaintenanceMode(false);
    const res2 = await db.getMaintenanceMode();
    expect(res2).toBeFalsy();

    await db.clearMaintenanceMode();
    const res3 = await db.getMaintenanceMode();
    expect(res3).toBeFalsy();
  });

  it("maintenance disables everything", async () => {
    const init = await db.isVoiceAnnounceEnabled(guildId);
    expect(init).toBeTruthy();

    await db.setMaintenanceMode(true);
    let res1 = await db.isVoiceEnabled(guildId);
    res1 = res1 || (await db.isVoiceAnnounceEnabled(guildId));
    expect(res1).toBeFalsy();

    await db.setMaintenanceMode(false);
    const res2 = await db.isVoiceAnnounceEnabled(guildId);
    expect(res2).toBeTruthy();

    await db.setMaintenanceMode(true);
    expect(db.voiceEnable(guildId)).rejects.toThrowError(MaintenanceError);
    expect(db.voiceDisable(guildId)).rejects.toThrowError(MaintenanceError);
    expect(db.voiceAnnounceEnable(guildId, "GLOBAL")).rejects.toThrowError(
      MaintenanceError,
    );
    expect(db.voiceAnnounceDisable(guildId)).rejects.toThrowError(
      MaintenanceError,
    );
  });
});
