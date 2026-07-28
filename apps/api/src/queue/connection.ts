import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const webhookEventsQueue = new Queue("webhook-events", {
  connection: redisConnection,
});

export const messageSendQueue = new Queue("message-send", {
  connection: redisConnection,
});
