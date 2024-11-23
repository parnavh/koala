-- CreateTable
CREATE TABLE "GuildMetrics" (
    "guildId" BIGINT NOT NULL,
    "voiceCharacters" INTEGER NOT NULL,

    CONSTRAINT "GuildMetrics_pkey" PRIMARY KEY ("guildId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildMetrics_guildId_key" ON "GuildMetrics"("guildId");
