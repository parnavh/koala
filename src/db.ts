import { Prisma, PrismaClient } from "@prisma/client";
import IORedis from "ioredis";
import { env } from "@/env";
import { MaintenanceError } from "@/errors";

export class Database {
  private prisma: PrismaClient;
  private redis: IORedis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  async deleteConfig(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config
      .delete({
        where: {
          guildId: guildIdBigInt,
        },
      })
      .catch(() => {});
  }

  async voiceEnable(guildId: string) {
    if (await this.getMaintenanceMode()) throw new MaintenanceError();

    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config.upsert({
      where: {
        guildId: guildIdBigInt,
      },
      create: {
        guildId: guildIdBigInt,
        voice: {
          create: {},
        },
      },
      update: {},
    });

    await this.prisma.voiceConfig.upsert({
      where: {
        guildId: guildIdBigInt,
      },
      create: {
        guildId: guildIdBigInt,
        enabled: true,
      },
      update: {
        enabled: true,
      },
    });
  }

  async voiceDisable(guildId: string) {
    if (await this.getMaintenanceMode()) throw new MaintenanceError();

    if (!this.isVoiceEnabled(guildId)) {
      return;
    }
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.voiceConfig.update({
      where: {
        guildId: guildIdBigInt,
      },
      data: {
        enabled: false,
      },
    });
  }

  async isVoiceEnabled(guildId: string) {
    if (await this.getMaintenanceMode()) return false;

    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
    });

    if (!config) {
      return true;
    }

    return config.enabled;
  }

  async voiceAnnounceEnable(
    guildId: string,
    mode: Prisma.VoiceConfigGetPayload<Prisma.VoiceConfigDefaultArgs>["announceMode"],
  ) {
    if (await this.getMaintenanceMode()) throw new MaintenanceError();

    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config.upsert({
      where: {
        guildId: guildIdBigInt,
      },
      update: {
        voice: {
          update: {
            enabled: true,
            announce: true,
            announceMode: mode,
            channels: {
              deleteMany: {
                guildId: guildIdBigInt,
              },
            },
          },
        },
      },
      create: {
        guildId: guildIdBigInt,
        voice: {
          create: {
            enabled: true,
            announce: true,
            announceMode: mode,
          },
        },
      },
    });

    return true;
  }

  async voiceAnnounceDisable(guildId: string) {
    if (await this.getMaintenanceMode()) throw new MaintenanceError();

    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
    });

    if (!config) {
      return true;
    }

    await this.prisma.voiceConfig.update({
      where: {
        guildId: guildIdBigInt,
      },
      data: {
        announce: false,
        announceMode: "GLOBAL",
        channels: {
          deleteMany: {
            guildId: guildIdBigInt,
          },
        },
      },
    });

    return true;
  }

  async isVoiceAnnounceEnabled(guildId: string, channelId?: string) {
    if (await this.getMaintenanceMode()) return false;

    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
      include: {
        channels: true,
      },
    });

    if (!config) return true;
    if (!config.enabled || !config.announce) return false;

    if (config.announceMode == "GLOBAL") return true;

    if (config.announceMode == "ENABLE") {
      if (!channelId) {
        return false;
      }

      const channelIdBigInt = BigInt(channelId);

      const res = config.channels.find(
        (channel) => channel.id === channelIdBigInt,
      );

      return Boolean(res);
    }

    if (config.announceMode == "DISABLE") {
      if (!channelId) {
        return true;
      }

      const channelIdBigInt = BigInt(channelId);

      const res = config.channels.find(
        (channel) => channel.id == channelIdBigInt,
      );

      return !Boolean(res);
    }

    throw new Error("This should not be reached");
  }

  async setVoiceAnnounceChannel(guildId: string, channelIds: string[]) {
    if (await this.getMaintenanceMode()) throw new MaintenanceError();

    const guildIdBigInt = BigInt(guildId);

    await this.prisma.voiceChannel.deleteMany({
      where: {
        guildId: guildIdBigInt,
      },
    });

    await this.prisma.voiceChannel.createMany({
      data: channelIds.map((id) => ({
        guildId: guildIdBigInt,
        id: BigInt(id),
      })),
    });
  }

  async getVoiceConfig(guildId: string) {
    return this.prisma.voiceConfig.findUnique({
      where: {
        guildId: BigInt(guildId),
      },
      include: {
        channels: true,
      },
    });
  }

  async deleteGuildMetrics(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.guildMetrics
      .delete({
        where: {
          guildId: guildIdBigInt,
        },
      })
      .catch(() => {});
  }

  async deleteUserMetrics(userId: string) {
    const userIdBigInt = BigInt(userId);

    await this.prisma.userActivity
      .deleteMany({
        where: { userId: userIdBigInt },
      })
      .catch(() => {});
  }

  async guildMetricsUpdate(
    guildId: string,
    voiceCharacters: number,
    memberCount: number = 0,
  ) {
    const guildIdBigInt = BigInt(guildId);

    const result = await this.prisma.guildMetrics.upsert({
      where: { guildId: guildIdBigInt },
      update: {
        voiceCharacters: { increment: voiceCharacters },
        memberCount,
        invocations: { increment: 1 },
      },
      create: {
        guildId: guildIdBigInt,
        voiceCharacters: voiceCharacters,
        memberCount,
        invocations: 1,
      },
    });

    return result;
  }

  async getMetrics(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    const result = await this.prisma.guildMetrics.findFirst({
      where: {
        guildId: guildIdBigInt,
      },
    });

    if (!result) return;

    return result;
  }

  async setMaintenanceMode(state: boolean) {
    if (state == false) return this.clearMaintenanceMode();
    await this.redis.set("global:maintenance", state.toString());
  }

  async getMaintenanceMode() {
    const res = await this.redis.get("global:maintenance");
    return res === "true";
  }

  async clearMaintenanceMode() {
    await this.redis.del("global:maintenance");
  }

  async getMonthlyActiveUsers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await this.prisma.userActivity.groupBy({
      by: ["userId"],
      where: { date: { gte: thirtyDaysAgo } },
    });

    return activeUsers.length;
  }

  async getMonthlyInvocations() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.userActivity.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { invocations: true },
    });

    return result._sum.invocations ?? 0;
  }

  async trackUserActivity(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.userActivity.upsert({
      where: { userId_date: { userId: BigInt(userId), date: today } },
      update: { invocations: { increment: 1 } },
      create: { userId: BigInt(userId), invocations: 1, date: today },
    });
  }

  async putGlobalMetrics(
    totalGuilds: number,
    totalUsers: number,
    totalActiveUsers: number,
  ) {
    await this.prisma.globalMetrics.create({
      data: {
        totalGuilds,
        totalUsers,
        totalActiveUsers,
      },
    });
  }
}
