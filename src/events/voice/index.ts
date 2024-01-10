import { type ArgsOf, Discord, On, Guard } from "discordx";
import { NotBot } from "./guards";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import type { VoiceState } from "discord.js";

function getVoiceMemberCount(state: VoiceState) {
  return state.channel!.members.filter((m) => !m.user.bot).size;
}

@Discord()
export class Voice {
  @On({ event: "voiceStateUpdate" })
  @Guard(NotBot)
  async userJoin(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient
  ) {
    if (oldState.channel || !newState.channelId) return;

    const enabled = await koala.db.voiceEnabled(
      newState.guild.id,
      newState.channelId
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
    client: KoalaClient
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

        koala.queue.destroyVoiceQueue(oldState.guild.id);
      }
      return;
    }

    const enabled = await koala.db.voiceEnabled(
      oldState.guild.id,
      oldState.channelId
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
    client: KoalaClient
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
}
