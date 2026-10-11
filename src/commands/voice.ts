import { DEFAULT_VOICE } from "@/constants";
import { ERROR_MESSAGES } from "@/errors";
import { hasVoicePerms } from "@/lib/voice/guards";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  type AutocompleteInteraction,
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
    @SlashOption({
      description: "voice model to use",
      name: "voice",
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    text: string,
    rawVoice: string | undefined,
    interaction: CommandInteraction | AutocompleteInteraction,
  ) {
    const voices = await koala.db.getVoices();

    if (interaction.isAutocomplete()) {
      let resp = voices;

      if (rawVoice) {
        resp = voices.filter((v) => v.display.toLowerCase().includes(rawVoice));
      }

      return interaction.respond(
        resp.slice(0, 25).map((og) => ({
          name: og.display,
          value: og.value.concat(`|${og.lanaguageCode}`),
        })),
      );
    }

    if (!interaction.guild) {
      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "This command can only be run in a server",
      });
    }

    const member = interaction.guild.members.cache.find(
      (member) => member.id === interaction.member?.user.id,
    );

    if (!member) {
      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Are you a ghost?",
      });
    }

    if (!member.voice.channel)
      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "You need to be in a voice channel to use this command",
      });

    if (
      member.voice.serverMute ||
      !member.permissionsIn(member.voice.channel).has("Speak")
    ) {
      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "You do not have permission to speak :(",
      });
    }

    if (!hasVoicePerms(interaction.guild.members.me, member.voice.channel)) {
      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `I do not have permission to view channel/connect/speak in <#${member.voice.channel.id}> :(`,
      });
    }

    if (!(await koala.db.isVoiceEnabled(member.guild.id))) {
      let content = "Voice module is disabled for this server :(";

      if (await koala.db.getMaintenanceMode())
        content = ERROR_MESSAGES["maintenance"];

      return void interaction.reply({
        flags: MessageFlags.Ephemeral,
        content,
      });
    }

    let reply_content = `Speaking: ${text}`;

    if (text.length > 1900) {
      reply_content = `Speaking: ${text.substring(0, 20)}...`;
    }

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: reply_content,
      allowedMentions: {},
    });

    let voice = DEFAULT_VOICE;

    if (rawVoice) {
      const [name, languageCode] = rawVoice.split("|");
      const found = voices.find((v) => v.value === name);
      if (found) voice = { name, languageCode };
    }

    koala.queue.addToVoiceQueue(text, {
      channelId: member.voice.channel.id,
      userId: member.user.id,
      guildId: interaction.guild.id,
      voice,
    });
  }
}
