import { type ArgsOf, Discord, On, Guard } from "discordx";
import { getVoiceConnection } from "@discordjs/voice";
import { NotBot } from "@discordx/utilities";
import type { VoiceState } from "discord.js";

function getVoiceMemberCount(state: VoiceState) {
  return state.channel!.members.filter((m) => !m.user.bot).size;
}

function disconnectVoice(guildId: string) {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.disconnect();
    connection.destroy();
  }
}

@Discord()
export class Voice {
  @On({ event: "voiceStateUpdate" })
  @Guard(NotBot)
  async userJoin(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    _: KoalaClient,
  ) {
    if (oldState.channel || !newState.channelId) return;

    const enabled = await koala.db.isVoiceAnnounceEnabled(
      newState.guild.id,
      newState.channelId,
    );

    if (!enabled) return;

    let message = `${newState.member?.displayName} joined`;
    let delay = 0;
    let channelId = newState.channelId;

    if (getVoiceMemberCount(newState) == 1) {
      message = `Welcome ${newState.member?.displayName}!`;
      delay = 2000;
    }

    setTimeout(() => {
      koala.queue.addToVoiceQueue(message, {
        channelId: channelId,
        guildId: newState.guild.id,
      });
    }, delay);
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
        disconnectVoice(oldState.guild.id);
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
        disconnectVoice(oldState.guild.id);
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
