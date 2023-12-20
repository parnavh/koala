import type { Database } from "@/db";
import type { Queue } from "@/queue";
import type { Client } from "discordx";

declare global {
  interface KoalaClient extends Client {}
  var koala: {
    client: KoalaClient;
    queue: Queue;
    db: Database;
  };
}
