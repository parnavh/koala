import {
  AudioPlayerStatus,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { createHash } from "crypto";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { VoiceData } from "@/queue";
import { Guild, ThreadMemberManager } from "discord.js";
import { AUDIO_BASE_PATH } from "@/constants";
import { createAudioFile } from "./google-tts";

const sanitizeText = (text: string) => text.replace(/[^\w\d]+/g, " ");

async function isVoiceChannelEmpty(guild: Guild, channelId: string) {
  let channel;

  try {
    channel = await guild.channels.fetch(channelId);
  } catch (error) {
    koala.logger.error(error);
  }

  if (!channel) {
    koala.logger.error(
      `ghost guild voice channel [guild: ${guild.id}  channelId: ${channelId}]`,
    );
    return true;
  }

  if (channel.members instanceof ThreadMemberManager) {
    koala.logger.error(
      `this should not be possible -> channel should not be a thread [guild: ${guild.id}  channelId: ${channelId}]`,
    );
    return true;
  }

  if (channel.members.filter((m) => !m.user.bot).size == 0) {
    return true;
  }

  return false;
}

export async function playText(rawText: string, options: VoiceData) {
  koala.db.trackUserActivity(options.userId);

  const sanitizedText = sanitizeText(rawText);

  const hash = createHash("sha256")
    .update(sanitizedText.concat(`|${options.voice.name}`))
    .digest("hex");

  const guild = global.koala.client.guilds.cache.find(
    (guild) => guild.id === options.guildId,
  );

  if (!guild) {
    koala.logger.error("No guild found while trying to play audio");
    return;
  }

  if (await isVoiceChannelEmpty(guild, options.channelId)) {
    return;
  }

  if (!existsSync(AUDIO_BASE_PATH)) {
    mkdirSync(AUDIO_BASE_PATH, { recursive: true });
  }

  const path = `${AUDIO_BASE_PATH}/${hash}.ogg`;

  if (!existsSync(path)) {
    koala.db.guildMetricsUpdate(
      options.guildId,
      sanitizedText.length,
      guild.memberCount,
    );

    await createAudioFile(sanitizedText, path, options.voice);
  }

  if (await isVoiceChannelEmpty(guild, options.channelId)) {
    return;
  }

  const audioResource = createAudioResource(
    createReadStream(`${AUDIO_BASE_PATH}/${hash}.ogg`),
  );

  const audioPlayer = koala.queue.getAudioPlayer(options.guildId);

  let connection = getVoiceConnection(options.guildId);

  if (!connection || connection.joinConfig.channelId !== options.channelId) {
    connection = joinVoiceChannel({
      channelId: options.channelId,
      guildId: options.guildId,
      adapterCreator: guild.voiceAdapterCreator,
    });

    if (connection.listenerCount("error") === 0) {
      connection.on("error", (error) => {
        koala.logger.error("Voice connection error:", error.message);
      });
    }
  }

  if (connection.state.status !== VoiceConnectionStatus.Ready) {
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch (error) {
      koala.logger.error(
        {
          connection,
          channel: await guild.channels.fetch(options.channelId),
          err: error,
        },
        `Unable to connect to ${options.channelId} in guild ${options.guildId} voiceState: ${connection.state.status}`,
      );
      connection.disconnect();
      connection.destroy();
      return;
    }
  }

  connection.subscribe(audioPlayer);

  const promise = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audioPlayer.removeListener(AudioPlayerStatus.Idle, idleAction);
      audioPlayer.removeListener("error", errorAction);
    };

    const errorAction = (err: any) => {
      cleanup();
      reject(err);
    };

    const idleAction = () => {
      cleanup();
      resolve();
    };

    audioPlayer.once("error", errorAction);
    audioPlayer.once(AudioPlayerStatus.Idle, idleAction);
  });

  audioPlayer.play(audioResource);

  return promise;
}
