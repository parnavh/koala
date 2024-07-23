-- CreateTable
CREATE TABLE "Config" (
    "guildId" BIGINT NOT NULL,
    "voiceEnabled" BOOLEAN NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "VoiceChannel" (
    "id" BIGINT NOT NULL,
    "guildId" BIGINT NOT NULL,

    CONSTRAINT "VoiceChannel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VoiceChannel" ADD CONSTRAINT "VoiceChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Config"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
