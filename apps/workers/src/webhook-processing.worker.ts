import { Worker, type Job } from "bullmq";
import { prisma } from "@chatcartpro/db";
import type { WhatsAppWebhookPayload } from "@chatcartpro/shared-types";
import { redisConnection } from "./connection.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Fan-out point for every inbound WhatsApp event (messages + delivery/read
 * status updates). Ingestion (apps/api) only ACKs and enqueues — all
 * side effects (persistence, AI pipelines, realtime push) happen here so a
 * slow/failing step never risks a missed Meta webhook ACK.
 *
 * Phase 0 scope: persist messages, update conversation window, update
 * delivery/read status. AI classification, escalation triggers, and
 * realtime push are Phase 2/3 additions — hook them in at the marked
 * extension points rather than inline in this handler as they're added.
 */
export function startWebhookProcessingWorker() {
  return new Worker<WhatsAppWebhookPayload>(
    "webhook-events",
    async (job: Job<WhatsAppWebhookPayload>) => {
      const payload = job.data;

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const { metadata, messages, statuses } = change.value;
          const phoneNumberId = metadata.phone_number_id;

          const waba = await prisma.wabaConnection.findUnique({
            where: { phoneNumberId },
          });
          if (!waba) {
            // Unknown phone_number_id — likely a webhook for a WABA not yet
            // connected in our system (e.g. stale subscription). Skip.
            continue;
          }

          if (messages) {
            for (const msg of messages) {
              await handleInboundMessage(waba.tenantId, phoneNumberId, msg);
            }
          }

          if (statuses) {
            for (const status of statuses) {
              await handleStatusUpdate(status);
            }
          }
        }
      }
    },
    { connection: redisConnection },
  );
}

async function handleInboundMessage(
  tenantId: string,
  _phoneNumberId: string,
  msg: NonNullable<WhatsAppWebhookPayload["entry"][number]["changes"][number]["value"]["messages"]>[number],
) {
  // Dedupe on Meta's message id — webhooks can be redelivered, and double
  // processing here would double-fire downstream AI/escalation logic.
  const existing = await prisma.message.findUnique({
    where: { metaMessageId: msg.id },
  });
  if (existing) return;

  const contact = await prisma.contact.upsert({
    where: { tenantId_phone: { tenantId, phone: msg.from } },
    create: { tenantId, phone: msg.from, optInStatus: "unknown" },
    update: {},
  });

  const conversation = await prisma.conversation.upsert({
    where: { tenantId_contactId: { tenantId, contactId: contact.id } },
    create: {
      tenantId,
      contactId: contact.id,
      windowExpiresAt: new Date(Date.now() + TWENTY_FOUR_HOURS_MS),
    },
    update: {
      windowExpiresAt: new Date(Date.now() + TWENTY_FOUR_HOURS_MS),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      status: "delivered",
      body: msg.text?.body ?? "",
      metaMessageId: msg.id,
    },
  });

  // Extension point (Phase 2): enqueue AI inbox-copilot classification/draft-reply job.
  // Extension point (Phase 3): enqueue lead-intent classification -> escalation engine.
  // Extension point (all phases): push to realtime channel for live inbox UI.
}

async function handleStatusUpdate(
  status: NonNullable<WhatsAppWebhookPayload["entry"][number]["changes"][number]["value"]["statuses"]>[number],
) {
  const message = await prisma.message.findUnique({
    where: { metaMessageId: status.id },
  });
  if (!message) return; // status for a message we don't have yet (rare ordering edge case)

  const timestamp = new Date(Number(status.timestamp) * 1000);
  const data: Record<string, unknown> = { status: status.status };
  if (status.status === "sent") data.sentAt = timestamp;
  if (status.status === "delivered") data.deliveredAt = timestamp;
  if (status.status === "read") data.readAt = timestamp;

  await prisma.message.update({ where: { id: message.id }, data });

  // Extension point (Phase 1): cascade into campaign_recipients counters.
  // Extension point (Phase 3): cascade into escalation delivered/read tracking.
}
