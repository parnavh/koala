import {
  AudioPlayerStatus,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import { createHash } from "crypto";
import { createReadStream, existsSync, mkdirSync } from "fs";
import textToSpeech from "@google-cloud/text-to-speech";
import { env } from "@/env";
import { VoiceData } from "@/queue";
import { writeFile } from "fs/promises";

const speechClient = new textToSpeech.TextToSpeechClient({
  credentials: env.GCP_KEY,
});

const BASE_PATH = "tmp/audio";

async function createAudioFile(text: string, hash: string) {
  const [response] = await speechClient.synthesizeSpeech({
    input: {
      text,
    },
    voice: {
      name: "en-US-WaveNet-C",
      languageCode: "en-US",
    },
    audioConfig: {
      audioEncoding: "OGG_OPUS",
    },
  });

  if (!response.audioContent) {
    throw new Error("Audio file generation failed\nText: " + text);
  }

  await writeFile(`${BASE_PATH}/${hash}.ogg`, response.audioContent);
}

const sanitizeText = (text: string) => text.replace(/[^\w\d]+/g, " ");

export async function playText(rawText: string, options: VoiceData) {
  const sanitizedText = sanitizeText(rawText);

  const hash = createHash("sha256").update(sanitizedText).digest("hex");

  if (!existsSync(BASE_PATH)) {
    mkdirSync(BASE_PATH, { recursive: true });
  }

  if (!existsSync(`${BASE_PATH}/${hash}.ogg`)) {
    await createAudioFile(sanitizedText, hash);
  }

  const audioResource = createAudioResource(
    createReadStream(`${BASE_PATH}/${hash}.ogg`),
  );

  const adapterCreator = global.koala.client.guilds.cache.find(
    (guild) => guild.id === options.guildId,
  )?.voiceAdapterCreator;

  if (!adapterCreator) {
    console.error("No guild found while trying to play audio");
    return;
  }

  const connection = joinVoiceChannel({
    channelId: options.channelId,
    guildId: options.guildId,
    adapterCreator,
  });

  const audioPlayer = koala.queue.getAudioPlayer(options.guildId);

  audioPlayer.play(audioResource);

  connection.subscribe(audioPlayer);

  return new Promise<void>((resolve, reject) => {
    const errorAction = () => {
      audioPlayer.removeListener(AudioPlayerStatus.Idle, idleAction);
      reject();
    };

    const idleAction = () => {
      audioPlayer.removeListener("error", errorAction);
      resolve();
    };

    audioPlayer.once("error", errorAction);

    audioPlayer.once(AudioPlayerStatus.Idle, idleAction);
  });
}
