import { startWebhookProcessingWorker } from "./webhook-processing.worker.js";
import { startMessageSendWorker } from "./message-send.worker.js";

const webhookWorker = startWebhookProcessingWorker();
const sendWorker = startMessageSendWorker();

for (const worker of [webhookWorker, sendWorker]) {
  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] job ${job?.id} failed:`, err);
  });
}

console.log("Workers started: webhook-events, message-send");

async function shutdown() {
  await Promise.all([webhookWorker.close(), sendWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
