import { env } from "@/env";
import { type CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class MiscCommands {
  @Slash({ description: "Get an invite link to the bot" })
  invite(interaction: CommandInteraction, client: KoalaClient): void {
    const url =
      env.CUSTOM_INVITE_LINK ||
      `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=${env.PERMISSIONS_INTEGER}&integration_type=0&scope=applications.commands+bot`;

    interaction.reply({
      content: `[Invite link](${url})`,
      ephemeral: true,
    });
  }
}
