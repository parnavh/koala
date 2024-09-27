-- AddForeignKey
ALTER TABLE "VoiceChannel" ADD CONSTRAINT "VoiceChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "VoiceConfig"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
