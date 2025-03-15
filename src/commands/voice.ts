import { ERROR_MESSAGES } from "@/errors";
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
export class VoiceCommands {
  @Slash({ description: "text to speak in your voice channel" })
  async tts(
    @SlashOption({
      description: "text to be spoken",
      name: "text",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    text: string,
    interaction: CommandInteraction,
  ) {
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

    if (!member.voice.channel)
      return void interaction.reply({
        ephemeral: true,
        content: "You need to be in a voice channel to use this command",
      });

    if (
      member.voice.serverMute ||
      !member.permissionsIn(member.voice.channel).has("Speak")
    ) {
      return void interaction.reply({
        ephemeral: true,
        content: "You do not have permission to speak :(",
      });
    }

    if (!(await koala.db.isVoiceEnabled(member.guild.id))) {
      let content = "Voice module is disabled for this server :(";

      if (await koala.db.getMaintenanceMode())
        content = ERROR_MESSAGES["maintenance"];

      return void interaction.reply({
        ephemeral: true,
        content,
      });
    }

    interaction.reply({
      ephemeral: true,
      content: `Speaking: ${text}`,
      allowedMentions: {},
    });

    koala.queue.addToVoiceQueue(text, {
      channelId: member.voice.channel.id,
      guildId: interaction.guild.id,
    });
  }
}
