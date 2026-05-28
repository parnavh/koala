import cron from "node-cron";
import { env } from "@/env";

function updateMetrics() {
  const serverCount = global.koala.client.guilds.cache.size;

  const memberCount = global.koala.client.guilds.cache.reduce(
    (total, curr) => (total += curr.memberCount),
    0,
  );

  koala.db.putGlobalMetrics(serverCount, memberCount);
}

async function updateBotStats() {
  const serverCount = global.koala.client.guilds.cache.size;
  const botId = global.koala.client.user?.id;

  if (!botId || !env.TOPGG_TOKEN) return;

  const response = await fetch(`https://top.gg/api/bots/${botId}/stats`, {
    method: "POST",
    headers: {
      Authorization: env.TOPGG_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ server_count: serverCount }),
  });

  if (!response.ok) {
    console.warn(
      `Failed to update stats: ${response.status} ${response.statusText}`,
    );
  }
}

cron.schedule("0 18 * * *", () => {
  updateMetrics();
  updateBotStats();
});
