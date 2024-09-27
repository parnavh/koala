/*
  Warnings:

  - You are about to drop the column `voiceEnabled` on the `Config` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VoiceAnnounceModes" AS ENUM ('GLOBAL', 'ENABLE', 'DISABLE');

-- DropForeignKey
ALTER TABLE "VoiceChannel" DROP CONSTRAINT "VoiceChannel_guildId_fkey";

-- AlterTable
ALTER TABLE "Config" DROP COLUMN "voiceEnabled";

-- CreateTable
CREATE TABLE "VoiceConfig" (
    "guildId" BIGINT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "announce" BOOLEAN NOT NULL,
    "announceMode" "VoiceAnnounceModes" NOT NULL,

    CONSTRAINT "VoiceConfig_pkey" PRIMARY KEY ("guildId")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceConfig_guildId_key" ON "VoiceConfig"("guildId");

-- AddForeignKey
ALTER TABLE "VoiceConfig" ADD CONSTRAINT "VoiceConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Config"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
