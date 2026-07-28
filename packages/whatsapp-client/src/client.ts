const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export interface WhatsAppClientConfig {
  phoneNumberId: string;
  accessToken: string;
  graphApiBase?: string;
}

export interface SendTextMessageParams {
  to: string;
  body: string;
  /** Message ID being replied to, for context threading. */
  replyToMessageId?: string;
}

export interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

export interface WhatsAppSendResult {
  messageId: string;
}

/**
 * Thin wrapper around Meta's WhatsApp Cloud API for a single phone_number_id.
 * One instance per WABA connection — callers are responsible for looking up
 * the right tenant's connection before constructing this.
 */
export class WhatsAppClient {
  private readonly baseUrl: string;

  constructor(private readonly config: WhatsAppClientConfig) {
    this.baseUrl = `${config.graphApiBase ?? GRAPH_API_BASE}/${config.phoneNumberId}`;
  }

  /**
   * Sends free-text. Only valid inside the 24h customer-service window —
   * callers must check conversation.windowExpiresAt before calling this.
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<WhatsAppSendResult> {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "text",
      text: { body: params.body },
    };
    if (params.replyToMessageId) {
      body.context = { message_id: params.replyToMessageId };
    }
    return this.post(body);
  }

  /**
   * Sends an approved template message. Required for outbound messages
   * outside the 24h window (e.g. marketing broadcasts).
   */
  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<WhatsAppSendResult> {
    const body = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        components: params.components ?? [],
      },
    };
    return this.post(body);
  }

  private async post(body: Record<string, unknown>): Promise<WhatsAppSendResult> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`WhatsApp send failed (${res.status}): ${errorBody}`);
    }

    const json = (await res.json()) as { messages: Array<{ id: string }> };
    return { messageId: json.messages[0].id };
  }
}
