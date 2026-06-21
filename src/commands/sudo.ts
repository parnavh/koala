import { BotPresence, BotPresenceMaintenance } from "@/constants";
import { env } from "@/env";
import { IsGuardUserCallback, IsGuildUser } from "@discordx/utilities";
import {
  type CommandInteraction,
  Team,
  ApplicationCommandOptionType,
} from "discord.js";
import {
  Discord,
  Guard,
  Guild,
  Slash,
  SlashChoice,
  SlashOption,
} from "discordx";

const OwnerOnly: IsGuardUserCallback = async ({ client, user }) => {
  if (!user) {
    return false;
  }

  const owner = (await client.application?.fetch())?.owner;
  if (!owner) return false;

  const members =
    owner instanceof Team ? owner.members.map((user) => user.id) : [owner.id];

  return Boolean(members.find((m) => m == user.id));
};

@Discord()
@Guard(IsGuildUser(OwnerOnly))
@Guild(...env.OWNER_SERVER_IDS)
export class SuperUserCommands {
  @Slash({ description: "Status" })
  async status(interaction: CommandInteraction, client: KoalaClient) {
    await interaction.deferReply({ ephemeral: true });
    const serverCount = client.guilds.cache.size;

    const memberCount = client.guilds.cache.reduce(
      (total, curr) => (total += curr.memberCount),
      0,
    );

    const mau = await koala.db.getMonthlyActiveUsers();
    const mi = await koala.db.getMonthlyInvocations();

    interaction.editReply({
      content: [
        `In \`${serverCount}\` servers`,
        `\`${memberCount}\` Users!`,
        `\`${mau}\` Active Users!`,
        `\`${mi}\` Invocations!`,
      ].join("\n"),
    });
  }

  @Slash({ description: "Manage maintenance mode" })
  async maintenance(
    @SlashChoice({ name: "Enable Maintenance mode", value: true })
    @SlashChoice({ name: "Disable Maintenance mode", value: false })
    @SlashOption({
      name: "state",
      description: "Set maintenance mode for bot",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    })
    state: boolean,
    interaction: CommandInteraction,
    _: KoalaClient,
  ) {
    await interaction.deferReply({ ephemeral: true });
    await koala.db.setMaintenanceMode(state);

    if (state === true) {
      koala.client.user?.setPresence(BotPresenceMaintenance);
      await koala.queue.pause();
    } else {
      koala.client.user?.setPresence(BotPresence);
      await koala.queue.resume();
    }

    interaction.editReply({
      content: "Maintenance mode " + (state === true ? "enabled" : "disabled"),
    });
  }

  @Slash({ description: "Message a guild owner" })
  async messageowner(
    @SlashOption({
      name: "guildid",
      description: "Guild ID",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    guildId: string,
    @SlashOption({
      name: "message",
      description: "Message to send",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    message: string,
    interaction: CommandInteraction,
    client: KoalaClient,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = await client.guilds.fetch(guildId);
      const owner = await client.users.fetch(guild.ownerId);
      await owner.send(message);
      interaction.editReply({
        content: [
          `Sent to **${owner.username}** (\`${owner.id}\`)`,
          `Guild: **${guild.name}** (\`${guild.id}\`)`,
        ].join("\n"),
      });
    } catch (error) {
      interaction.editReply({ content: `Failed: ${error}` });
    }
  }
}
