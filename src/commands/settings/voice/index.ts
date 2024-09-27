import type { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";

@Discord()
@SlashGroup({
  name: "voice",
  root: "settings",
  description: "Manage voice module settings",
})
@SlashGroup("voice", "settings")
export class VoiceSettings {
  @Slash({ description: "Enable Voice Module" })
  async enable(interaction: CommandInteraction) {
    if (!interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    await koala.db.voiceEnable(interaction.guildId);

    interaction.reply({
      content: "Voice module has been enabled",
      ephemeral: true,
    });
  }

  @Slash({ description: "Disable voice module" })
  async disable(interaction: CommandInteraction) {
    if (!interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    await koala.db.voiceDisable(interaction.guildId);

    interaction.reply({
      content: "Voice module has been disabled",
      ephemeral: true,
    });
  }
}
