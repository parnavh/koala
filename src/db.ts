import { Prisma, PrismaClient } from "@prisma/client";

export class Database {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initConfig(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config.create({
      data: {
        guildId: guildIdBigInt,
        voice: {
          create: {},
        },
      },
    });
  }

  async deleteConfig(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config.delete({
      where: {
        guildId: guildIdBigInt,
      },
    });
  }

  async voiceEnable(guildId: string) {
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
    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
    });

    if (!config || !config.enabled) {
      return false;
    }

    return true;
  }

  async voiceAnnounceEnable(
    guildId: string,
    mode: Prisma.VoiceConfigGetPayload<Prisma.VoiceConfigDefaultArgs>["announceMode"],
  ) {
    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
    });

    if (!config) {
      this.initConfig(guildId);
    }

    await this.prisma.voiceConfig.update({
      where: {
        guildId: guildIdBigInt,
      },
      data: {
        enabled: true,
        announce: true,
        announceMode: mode,
        channels: {
          deleteMany: {
            guildId: guildIdBigInt,
          },
        },
      },
    });

    return true;
  }

  async voiceAnnounceDisable(guildId: string) {
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
    const guildIdBigInt = BigInt(guildId);

    const config = await this.prisma.voiceConfig.findUnique({
      where: {
        guildId: guildIdBigInt,
      },
      include: {
        channels: true,
      },
    });

    if (!config || !config.enabled || !config.announce) {
      return false;
    }

    if (config.announceMode == "GLOBAL") {
      return true;
    }

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
}
