-- AlterTable
ALTER TABLE "GuildMetrics" ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VoiceConfig" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "announce" SET DEFAULT true;
