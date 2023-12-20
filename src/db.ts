import { PrismaClient } from "@prisma/client";

// TODO implement caching
export class Database {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async voiceEnabled(guildId: string, channelId: string) {
    const guildIdBigInt = BigInt(guildId);
    const channelIdBigInt = BigInt(channelId);

    const guild = await this.prisma.config.findUnique({
      where: { guildId: guildIdBigInt },
      include: { voiceChannels: true },
    });

    if (!guild || !guild.voiceEnabled) {
      return false;
    }

    if (guild.voiceChannels.length === 0) {
      return true;
    }

    if (guild.voiceChannels.find((c) => c.id === channelIdBigInt)) {
      return true;
    }

    return false;
  }
}
