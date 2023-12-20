import { GuardFunction, ArgsOf } from "discordx";

export const NotBot: GuardFunction<ArgsOf<"voiceStateUpdate">> = async (
  [oldState, newState],
  _,
  next
) => {
  if (!newState.member?.user.bot || !oldState.member?.user.bot) {
    await next();
  }
};
