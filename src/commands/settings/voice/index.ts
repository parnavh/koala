import { MaintenanceError } from "@/errors";
import { PermissionGuard } from "@discordx/utilities";
import type { CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashGroup } from "discordx";

@Discord()
@SlashGroup({
  name: "voice",
  root: "settings",
  description: "Manage voice module settings",
})
@SlashGroup("voice", "settings")
export class VoiceSettings {
  @Slash({ description: "Enable Voice Module" })
  @Guard(
    PermissionGuard(["ManageGuild"], {
      content: "You cannot use this command!",
      ephemeral: true,
    }),
  )
  async enable(interaction: CommandInteraction) {
    if (!interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    let content = "Voice module has been enabled";

    try {
      await koala.db.voiceEnable(interaction.guildId);
    } catch (e) {
      if (e instanceof MaintenanceError) content = e.message;
      else content = "Something went wrong, please try again later!";
    }

    interaction.reply({
      content,
      ephemeral: true,
    });
  }

  @Slash({ description: "Disable voice module" })
  @Guard(
    PermissionGuard(["ManageGuild"], {
      content: "You cannot use this command!",
      ephemeral: true,
    }),
  )
  async disable(interaction: CommandInteraction) {
    if (!interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    let content = "Voice module has been disabled";

    try {
      await koala.db.voiceDisable(interaction.guildId);
    } catch (e) {
      if (e instanceof MaintenanceError) content = e.message;
      else content = "Something went wrong, please try again later!";
    }

    interaction.reply({
      content,
      ephemeral: true,
    });
  }
}
