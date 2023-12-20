import { Queue } from "@/queue";
import { Client } from "discordx";

declare global {
  interface KoalaClient extends Client {}
  var koala: {
    client: KoalaClient;
    queue: Queue;
  };
}
