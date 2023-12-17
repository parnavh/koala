import { Queue } from "@/queue";
import { Client as DefaultClient } from "discordx";

declare module "discordx" {
  interface Client extends DefaultClient {
    queue: Queue;
  }
}
