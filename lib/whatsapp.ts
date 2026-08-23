const WHATSAPP_GRAPH_API_VERSION = "v26.0";

type WhatsAppSendResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function getWhatsAppConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is not configured.");
  }

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured.");
  }

  return {
    accessToken,
    phoneNumberId,
  };
}

function normalizeRecipient(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");

  if (!normalized) {
    throw new Error("A valid WhatsApp recipient number is required.");
  }

  return normalized;
}

export async function sendWhatsAppText(
  recipient: string,
  message: string,
) {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();

  const to = normalizeRecipient(recipient);
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("WhatsApp message cannot be empty.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: cleanMessage,
        },
      }),
    },
  );

  const responseText = await response.text();

  let data: WhatsAppSendResponse;

  try {
    data = responseText
      ? (JSON.parse(responseText) as WhatsAppSendResponse)
      : {};
  } catch {
    throw new Error(
      `WhatsApp returned an invalid response (${response.status}).`,
    );
  }

  if (!response.ok) {
    const metaMessage =
      data.error?.message ||
      `WhatsApp API request failed with status ${response.status}.`;

    throw new Error(metaMessage);
  }

  return data;
}