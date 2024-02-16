import { ApplicationCommandOptionType, type CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
export class VoiceCommands {

  @Slash({ description: "text to speak in your voice channel" })
  tts(
    @SlashOption({
      description: "text to be spoken",
      name: "text",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    text: string,
    interaction: CommandInteraction): void {
    const guild = koala.client.guilds.cache.find((guild) => guild.id === interaction.guild?.id)
    if (!guild) return void interaction.reply({ ephemeral: true, content: "Command can only be run in guild" })

    const member = guild.members.cache.find(member => member.id === interaction.member?.user.id);

    if (!member) return void interaction.reply({ ephemeral: true, content: "Are you a ghost?" })

    const voiceChannelId = member.voice.channelId;

    if (!voiceChannelId) return void interaction.reply({ ephemeral: true, content: "You need to be in a voice channel to use this command" })

    koala.queue.addToVoiceQueue(text, { channelId: voiceChannelId, guildId: guild.id })

    interaction.reply({ ephemeral: true, content: `Speaking: ${text}`, allowedMentions: {} })
  }
}
