import { voicePerms } from "@/constants";
import { GuildMember, VoiceBasedChannel } from "discord.js";

export const hasVoicePerms = (
  me: GuildMember | null,
  channel?: VoiceBasedChannel,
) => {
  if (!channel || !me) return false;

  return voicePerms.every((perm) => me.permissionsIn(channel).has(perm));
};
