import {
  AudioPlayerStatus,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import { createHash } from "crypto";
import { createReadStream, existsSync, mkdirSync } from "fs";
import sdk from "microsoft-cognitiveservices-speech-sdk";
import { env } from "@/env";
import { VoiceData } from "@/queue";
import { writeFile } from "fs/promises";

const speechConfig = sdk.SpeechConfig.fromSubscription(
  env.AZURE_SPEECH_KEY,
  env.AZURE_SPEECH_REGION
);

speechConfig.speechSynthesisOutputFormat = 24;

const BASE_PATH = "tmp/audio";

async function createAudioFile(text: string, hash: string) {
  return new Promise((resolve, reject) => {
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      text,
      async (result) => {
        const { audioData } = result;
        synthesizer.close();
        await writeFile(`${BASE_PATH}/${hash}.ogg`, Buffer.from(audioData));
        resolve(true);
      },
      (error) => {
        synthesizer.close();
        console.error(error);
        reject(error);
      }
    );
  });
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
    createReadStream(`${BASE_PATH}/${hash}.ogg`)
  );

  const adapterCreator = global.koala.client.guilds.cache.find(
    (guild) => guild.id === options.guildId
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
