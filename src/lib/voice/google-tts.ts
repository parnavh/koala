import textToSpeech from "@google-cloud/text-to-speech";
import { writeFile } from "fs/promises";
import { env } from "@/env";
import { VoiceData } from "@/queue";

const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: env.GCP_CLIENT_EMAIL,
    private_key: env.GCP_PRIVATE_KEY,
  },
});

export async function createAudioFile(
  text: string,
  path: string,
  voice: VoiceData["voice"],
) {
  console.log(voice);
  const [response] = await client.synthesizeSpeech({
    input: {
      text,
    },
    voice,
    audioConfig: {
      audioEncoding: "OGG_OPUS",
    },
  });

  if (!response.audioContent) {
    throw new Error("Audio file generation failed\nText: " + text);
  }

  await writeFile(path, response.audioContent);
}

function formatVoiceName(voice: {
  name?: string | null;
  ssmlGender?: string | number | null;
  languageCodes?: string[] | null;
}) {
  if (!voice.name) {
    koala.logger.error("google-tts voice.name not a string");
    return "";
  }

  if (!voice.name.includes("-")) {
    return "";
  }

  const regionNames = new Intl.DisplayNames(["en"], {
    type: "region",
  });

  const name = voice.name;
  const parts = name.split("-");
  const regionCode = parts[1];

  let region = regionCode ? regionNames.of(regionCode) : "";

  let language = new Intl.DisplayNames(["en"], { type: "language" }).of(
    parts[0]!,
  );

  const genderMap: Record<string, string> = {
    FEMALE: "Female",
    MALE: "Male",
  };

  const gender = genderMap[String(voice.ssmlGender)];
  const voiceFamily = parts.slice(2).join(" ");

  return `${language} (${region}) · ${gender}`.concat(
    voiceFamily ? ` · ${voiceFamily}` : "",
  );
}

export async function getVoices() {
  const [result] = await client.listVoices({});
  const voices = result.voices ?? [];

  const formattedVoices = voices
    .map((voice) => ({
      display: formatVoiceName(voice),
      value: voice.name ?? "",
      lanaguageCode: voice.languageCodes?.[0] ?? "",
    }))
    .filter((v) => Boolean(v.display));

  return formattedVoices;
}
