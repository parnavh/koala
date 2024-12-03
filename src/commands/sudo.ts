import { env } from "@/env";
import { IsGuardUserCallback, IsGuildUser } from "@discordx/utilities";
import { type CommandInteraction, Team } from "discord.js";
import { Discord, Guard, Guild, Slash } from "discordx";

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
    const serverCount = client.guilds.cache.size;
    interaction.reply({
      content: `In \`${serverCount}\` servers`,
      ephemeral: true,
    });
  }
}
