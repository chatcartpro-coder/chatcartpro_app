import type { FastifyInstance } from "fastify";
import { verifyWebhookSignature, verifyWebhookSubscription } from "@chatcartpro/whatsapp-client";
import { whatsAppWebhookPayloadSchema } from "@chatcartpro/shared-types";
import { webhookEventsQueue } from "../queue/connection.js";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? "";

export async function webhookRoutes(app: FastifyInstance) {
  // Meta's one-time subscription verification handshake.
  app.get("/webhooks/whatsapp", async (req, reply) => {
    const challenge = verifyWebhookSubscription(
      req.query as Record<string, string | undefined>,
      VERIFY_TOKEN,
    );
    if (challenge === null) {
      return reply.code(403).send("Verification failed");
    }
    return reply.code(200).send(challenge);
  });

  // Inbound events (messages + status updates). Must ACK fast — all real
  // work is deferred to the webhook-processing worker via the queue.
  app.post("/webhooks/whatsapp", async (req, reply) => {
    const rawBody = req.rawBody as string | undefined;
    const signature = req.headers["x-hub-signature-256"] as string | undefined;

    if (!rawBody || !verifyWebhookSignature(rawBody, signature, APP_SECRET)) {
      return reply.code(401).send("Invalid signature");
    }

    const parsed = whatsAppWebhookPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      // ACK anyway — Meta will retry on non-2xx, and a malformed/unknown
      // payload shape isn't recoverable by retrying.
      req.log.warn({ error: parsed.error }, "unrecognized webhook payload shape");
      return reply.code(200).send("ignored");
    }

    // Dedupe key uses Meta's own event ids further downstream in the worker;
    // enqueue immediately and return 200 within Meta's timeout window.
    await webhookEventsQueue.add("whatsapp-event", parsed.data, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });

    return reply.code(200).send("ok");
  });
}
