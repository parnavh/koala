import { env } from "@/env";
import { EmbedBuilder, type CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

function getInviteLink(botId: string) {
  return (
    env.CUSTOM_INVITE_LINK ||
    `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=${env.PERMISSIONS_INTEGER}&integration_type=0&scope=applications.commands+bot`
  );
}

@Discord()
export class MiscCommands {
  @Slash({ description: "Get an invite link to the bot" })
  invite(interaction: CommandInteraction, client: KoalaClient): void {
    const url = getInviteLink(client.user!.id);

    interaction.reply({
      content: `[Invite link](${url})`,
      ephemeral: true,
    });
  }

  @Slash({ description: "Feeling lost? Get to know the basics!" })
  help(interaction: CommandInteraction, client: KoalaClient): void {
    const links = [`[Invite me](${getInviteLink(client.user!.id)})`];

    if (env.SUPPORT_SERVER_LINK) {
      links.push(`[Support Server](${env.SUPPORT_SERVER_LINK})`);
    }

    const helpEmbed = new EmbedBuilder()
      .setColor(0xb46547)
      .setTitle("Help")
      .setDescription(
        `Koala is a voice utility-focused bot that enhances your discord experience by announcing users as they join the channel and much more
        \nUse the \`/settings announce\` command and its subcommands to customize which channels Koala announces in
        \nBy default, announcements are enabled for every channel, so you're ready to go right out of the box!\n`,
      )
      .addFields({
        name: "Links",
        value: links.join(" • "),
      });

    interaction.reply({
      embeds: [helpEmbed],
      ephemeral: true,
    });
  }
}
