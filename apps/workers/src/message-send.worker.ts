import { Worker, type Job } from "bullmq";
import { prisma } from "@chatcartpro/db";
import { WhatsAppClient } from "@chatcartpro/whatsapp-client";
import { redisConnection } from "./connection.js";

export interface SendJobData {
  tenantId: string;
  conversationId: string;
  to: string;
  body: string;
}

/**
 * Consumes outbound-send jobs. Enforces the 24h-window/template rule and
 * per-WABA rate limits via BullMQ's built-in group/priority options at the
 * queue-add call site (apps/api, apps/workers callers) rather than here —
 * this worker's job is just: look up credentials, send, persist result.
 *
 * Job priority convention (lower number = higher priority in BullMQ):
 * 1 = escalation/transactional, 5 = bulk campaign broadcast.
 */
export function startMessageSendWorker() {
  return new Worker<SendJobData>(
    "message-send",
    async (job: Job<SendJobData>) => {
      const { tenantId, conversationId, to, body } = job.data;

      const conversation = await prisma.conversation.findUniqueOrThrow({
        where: { id: conversationId },
      });

      if (!conversation.windowExpiresAt || conversation.windowExpiresAt < new Date()) {
        throw new Error(
          `Conversation ${conversationId} is outside the 24h window — must send via approved template, not free text`,
        );
      }

      const waba = await prisma.wabaConnection.findFirstOrThrow({
        where: { tenantId },
      });

      const client = new WhatsAppClient({
        phoneNumberId: waba.phoneNumberId,
        accessToken: waba.accessTokenEnc, // TODO: decrypt before use once encryption-at-rest is wired in
      });

      const result = await client.sendTextMessage({ to, body });

      await prisma.message.create({
        data: {
          conversationId,
          direction: "outbound",
          status: "sent",
          body,
          metaMessageId: result.messageId,
          sentAt: new Date(),
        },
      });

      return result;
    },
    { connection: redisConnection },
  );
}
