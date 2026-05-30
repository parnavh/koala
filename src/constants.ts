import { ActivityType } from "discord.js";

export const BotPresence = {
  activities: [
    { name: "Watching you waste time", type: ActivityType.Watching },
  ],
} as const;

export const BotPresenceMaintenance = {
  activities: [{ name: "Maintenance Underway 🚧", type: ActivityType.Custom }],
} as const;

export const AUDIO_BASE_PATH = "tmp/audio";

export const ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE = 25;

export const HELP_DESCRIPTION = `Koala is a voice utility-focused bot that enhances your discord experience by announcing users as they join the channel and much more
\nUse the \`/settings announce\` command and its subcommands to customize which channels Koala announces in
\nBy default, announcements are enabled for every channel, so you're ready to go right out of the box!\n`;

export const MAX_TTS_TIME_MS = 60 * 1000;
