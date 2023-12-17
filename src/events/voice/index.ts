import { type ArgsOf, Discord, On } from "discordx";

@Discord()
export class Voice {
  @On({ event: "voiceStateUpdate" })
  async userJoin(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient
  ) {
    if (oldState.channel || !newState.channel) return;

    await client.queue.addToVoiceQueue(
      `${newState.member?.displayName} joined`,
      newState.guild.id
    );
  }

  @On({ event: "voiceStateUpdate" })
  async userLeave(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient
  ) {
    if (!oldState.channel || newState.channel) return;

    await client.queue.addToVoiceQueue(
      `${oldState.member?.displayName} left`,
      oldState.guild.id
    );
  }

  @On({ event: "voiceStateUpdate" })
  userMove(
    [oldState, newState]: ArgsOf<"voiceStateUpdate">,
    client: KoalaClient
  ) {
    if (!oldState.channel || !newState.channel) return;

    console.log(
      `User ${newState.member?.displayName} moved from ${oldState.channel?.name} to ${newState.channel?.name}`
    );
    // TODO
  }
}
