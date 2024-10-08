import { type ArgsOf, Discord, On, Guard, GuardFunction } from "discordx";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import type { VoiceState } from "discord.js";

function getVoiceMemberCount(state: VoiceState) {
  return state.channel!.members.filter((m) => !m.user.bot).size;
}

const NotBot: GuardFunction<ArgsOf<"voiceStateUpdate">> = async (
  [oldState, newState],
  _,
  next,
) => {
  if (!newState.member?.user.bot || !oldState.member?.user.bot) {
    await next();
  }
};

@Discord()
export class Voice {
  @On({ event: "voiceStateUpdate" })
  @Guard(NotBot)
  async userJoin(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient,
  ) {
    if (oldState.channel || !newState.channelId) return;

    const enabled = await koala.db.isVoiceAnnounceEnabled(
      newState.guild.id,
      newState.channelId,
    );

    if (!enabled) return;

    koala.queue.addToVoiceQueue(`${newState.member?.displayName} joined`, {
      channelId: newState.channelId,
      guildId: newState.guild.id,
    });
  }

  @On({ event: "voiceStateUpdate" })
  @Guard(NotBot)
  async userLeave(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient,
  ) {
    if (!oldState.channelId || newState.channel) return;

    if (getVoiceMemberCount(oldState) === 0) {
      if (
        oldState.channel?.members.find((m) => m.user.id === client.user!.id)
      ) {
        const connection = getVoiceConnection(oldState.guild.id);
        if (connection) {
          connection.disconnect();
          connection.destroy();
        }

        await koala.queue.destroyVoiceQueue(oldState.guild.id);
      }
      return;
    }

    const enabled = await koala.db.isVoiceAnnounceEnabled(
      oldState.guild.id,
      oldState.channelId,
    );

    if (!enabled) return;

    koala.queue.addToVoiceQueue(`${oldState.member?.displayName} left`, {
      channelId: oldState.channelId,
      guildId: oldState.guild.id,
    });
  }

  @On({ event: "voiceStateUpdate" })
  @Guard(NotBot)
  userMove(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient,
  ) {
    if (!oldState.channelId || !newState.channelId) return;
    if (oldState.channelId === newState.channelId) return;

    if (getVoiceMemberCount(oldState) === 0) {
      if (
        oldState.channel?.members.find((m) => m.user.id === client.user!.id)
      ) {
        joinVoiceChannel({
          channelId: newState.channelId,
          guildId: newState.guild.id,
          adapterCreator: newState.guild.voiceAdapterCreator,
        });
      }
      return;
    }
  }

  @On({ event: "voiceStateUpdate" })
  async botDisconnected(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient,
  ) {
    if (!oldState.channelId || newState.channel) return;
    if (!oldState.member || !client.user) return;
    if (oldState.member.id !== client.user.id) return;

    await koala.queue.destroyVoiceQueue(oldState.guild.id);
  }
}
