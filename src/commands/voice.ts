import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
export class VoiceCommands {
  @Slash({ description: "text to speak in your voice channel" })
  tts(
    @SlashOption({
      description: "text to be spoken",
      name: "text",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    text: string,
    interaction: CommandInteraction,
  ): void {
    if (!interaction.guild) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    const member = interaction.guild.members.cache.find(
      (member) => member.id === interaction.member?.user.id,
    );

    if (!member) {
      return void interaction.reply({
        ephemeral: true,
        content: "Are you a ghost?",
      });
    }

    const voiceChannelId = member.voice.channelId;

    if (!voiceChannelId)
      return void interaction.reply({
        ephemeral: true,
        content: "You need to be in a voice channel to use this command",
      });

    interaction.reply({
      ephemeral: true,
      content: `Speaking: ${text}`,
      allowedMentions: {},
    });

    koala.queue.addToVoiceQueue(text, {
      channelId: voiceChannelId,
      guildId: interaction.guild.id,
    });
  }
}
