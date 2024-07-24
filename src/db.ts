import { PrismaClient } from "@prisma/client";

export class Database {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async voiceEnable(guildId: string) {
    const guildIdBigInt = BigInt(guildId);

    await this.prisma.config.upsert({
      where: {
        guildId: guildIdBigInt,
      },
      create: {
        guildId: guildIdBigInt,
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
      return false;
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
}
