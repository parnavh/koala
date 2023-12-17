import { Queue as Bull, Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/env";
import { playText } from "@/events/voice/handler";

type Voice = {
  queue: Bull<VoiceData>;
  worker: Worker<VoiceData>;
};

export type VoiceData = {};

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
    playText(job.name, job.data);
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
    this.voice[guildId] = { queue, worker };
  }

  async addToVoiceQueue(text: string, guildId: string) {
    if (!this.voice[guildId]) {
      this.addVoiceQueue(guildId);
    }
    const queue = this.voice[guildId].queue;
    await queue.add(text, {});
  }
}
