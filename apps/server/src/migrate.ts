import { runMigrations } from "./db/client.js";

async function run() {
  await runMigrations();
  // eslint-disable-next-line no-console
  console.log("Migrations applied");
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
