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
    interaction.deferReply({ ephemeral: true });
    const serverCount = client.guilds.cache.size;

    const guilds: Promise<number>[] = [];

    client.guilds.cache.forEach((guild) => {
      guilds.push(
        new Promise(async (resolve, _reject) => {
          var members = await guild.members.fetch();
          members = members.filter((m) => !m.user.bot);
          resolve(members.size);
        }),
      );
    });

    const res = await Promise.all(guilds);

    const memberCount = res.reduce((prevVal, currVal) => prevVal + currVal);

    interaction.followUp({
      content: `In \`${serverCount}\` servers\n\`${memberCount}\` Users!`,
      ephemeral: true,
    });
  }
}
