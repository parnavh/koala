import { Queue as Bull, Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/env";
import { playText } from "@/lib/voice/handler";
import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";

type Voice = {
  queue: Bull<VoiceData>;
  worker: Worker<VoiceData>;
  audioPlayer: AudioPlayer;
};

export type VoiceData = {
  guildId: string;
  channelId: string;
};

export class Queue {
  private voice: { [key: string]: Voice };
  private connection: IORedis;

  constructor() {
    this.voice = {};
    this.connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  private async voiceWorker(job: Job<VoiceData>) {
    await playText(job.name, job.data);
  }

  private addVoiceQueue(guildId: string) {
    if (this.voice[guildId]) {
      return;
    }
    const queue = new Bull<VoiceData>(`voice-${guildId}`, {
      connection: this.connection,
    });

    const worker = new Worker<VoiceData>(`voice-${guildId}`, this.voiceWorker, {
      connection: this.connection,
    });
    worker.on("failed", console.error);

    const audioPlayer = createAudioPlayer();
    this.voice[guildId] = { queue, worker, audioPlayer };
  }

  getAudioPlayer(guildId: string) {
    return this.voice[guildId].audioPlayer;
  }

  async addToVoiceQueue(text: string, options: VoiceData) {
    if (!this.voice[options.guildId]) {
      this.addVoiceQueue(options.guildId);
    }
    const queue = this.voice[options.guildId].queue;
    await queue.add(text, options);
  }

  destroyVoiceQueue(guildId: string) {
    if (!this.voice[guildId]) {
      return;
    }
    this.voice[guildId].queue.obliterate({ force: true });
    this.voice[guildId].worker.close(true);
    delete this.voice[guildId];
  }
}
