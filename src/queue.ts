import { Queue as Bull, Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/env";
import { playText } from "@/lib/voice/handler";
import { AudioPlayer, createAudioPlayer } from "@discordjs/voice";
import { MAX_TTS_TIME_MS } from "@/constants";

type Voice = {
  queue: Bull<VoiceData>;
  worker: Worker<VoiceData>;
  audioPlayer: AudioPlayer;
};

export type VoiceData = {
  guildId: string;
  userId: string;
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

    this.init();
  }

  async init() {
    const allKeys = await this.connection.keys("bull:voice-*:meta");
    const pausedKeys = await this.connection.keys("bull:voice-*:paused");

    const pausedGuilds = new Set(
      pausedKeys.map((key) => key.match(/-(\d+):/)?.[1]).filter(Boolean),
    );

    for (const key of allKeys) {
      const guildId = key.match(/-(\d+):/)?.[1];
      if (!guildId) continue;

      if (pausedGuilds.has(guildId)) {
        this.addVoiceQueue(guildId);
        continue;
      }

      const orphanedKeys = await this.connection.keys(
        `bull:voice-${guildId}:*`,
      );
      if (orphanedKeys.length) this.connection.del(...orphanedKeys);
    }
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

    const worker = new Worker<VoiceData>(
      `voice-${guildId}`,
      (job) => this.voiceWorker(job),
      {
        connection: this.connection,
        stalledInterval: MAX_TTS_TIME_MS,
        maxStalledCount: 1,
      },
    );
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
    await queue.add(text, options, {
      removeOnComplete: true,
      removeOnFail: true,
    });
  }

  async destroyVoiceQueue(guildId: string) {
    if (!this.voice[guildId]) {
      return;
    }
    const { queue, worker, audioPlayer } = this.voice[guildId];

    audioPlayer.stop();
    await worker.close(true);
    await queue.obliterate({ force: true });
    delete this.voice[guildId];
  }

  async pause() {
    const promises = [];
    for (const guildId in this.voice) {
      const { queue, worker } = this.voice[guildId];

      promises.push(queue.pause());

      if ((await queue.getActiveCount()) > 0) {
        promises.push(
          new Promise<void>((resolve) => {
            worker.once("drained", resolve);
          }),
        );
      }
    }

    await Promise.allSettled(promises);
  }

  async resume() {
    const promises = [];

    for (const guildId in this.voice) {
      promises.push(this.voice[guildId].queue.resume());
    }

    await Promise.allSettled(promises);
  }
}
