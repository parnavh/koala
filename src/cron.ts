import cron from "node-cron";

cron.schedule("1 0 * * *", () => {
  const serverCount = global.koala.client.guilds.cache.size;

  const memberCount = global.koala.client.guilds.cache.reduce(
    (total, curr) => (total += curr.memberCount),
    0,
  );

  koala.db.putGlobalMetrics(serverCount, memberCount);
});
