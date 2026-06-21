import { GuildMember, VoiceBasedChannel } from "discord.js";

export const hasVoicePerms = (
  me: GuildMember | null,
  channel?: VoiceBasedChannel,
) => {
  if (!channel || !me) return false;

  return (["Connect", "Speak"] as const).every((perm) =>
    me.permissionsIn(channel).has(perm),
  );
};
