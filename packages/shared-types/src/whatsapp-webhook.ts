import { z } from "zod";

// Minimal shape of Meta's WhatsApp Cloud API webhook payload.
// Only the fields the app actually consumes are validated; unknown
// fields are passed through so future Meta payload additions don't
// break parsing.

export const whatsAppStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string(),
  recipient_id: z.string(),
});

export const whatsAppInboundMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  context: z.object({ id: z.string() }).optional(),
});

export const whatsAppWebhookEntrySchema = z.object({
  id: z.string(),
  changes: z.array(
    z.object({
      field: z.string(),
      value: z.object({
        messaging_product: z.literal("whatsapp"),
        metadata: z.object({
          display_phone_number: z.string().optional(),
          phone_number_id: z.string(),
        }),
        messages: z.array(whatsAppInboundMessageSchema).optional(),
        statuses: z.array(whatsAppStatusSchema).optional(),
      }),
    }),
  ),
});

export const whatsAppWebhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(whatsAppWebhookEntrySchema),
});

export type WhatsAppWebhookPayload = z.infer<typeof whatsAppWebhookPayloadSchema>;
export type WhatsAppStatus = z.infer<typeof whatsAppStatusSchema>;
export type WhatsAppInboundMessage = z.infer<typeof whatsAppInboundMessageSchema>;
