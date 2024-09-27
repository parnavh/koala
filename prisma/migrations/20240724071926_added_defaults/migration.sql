-- AlterTable
ALTER TABLE "VoiceConfig" ALTER COLUMN "enabled" SET DEFAULT false,
ALTER COLUMN "announce" SET DEFAULT false,
ALTER COLUMN "announceMode" SET DEFAULT 'GLOBAL';
