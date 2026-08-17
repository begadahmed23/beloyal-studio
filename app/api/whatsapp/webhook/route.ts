import { NextRequest, NextResponse } from "next/server";

function getVerifyToken() {
  const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!token) {
    throw new Error(
      "WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured.",
    );
  }

  return token;
}

/*
 * Meta calls GET once when you connect the webhook.
 *
 * It sends:
 * hub.mode
 * hub.verify_token
 * hub.challenge
 *
 * If the token matches ours, we must return hub.challenge.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const verifyToken = searchParams.get(
      "hub.verify_token",
    );
    const challenge = searchParams.get(
      "hub.challenge",
    );

    const expectedVerifyToken = getVerifyToken();

    if (
      mode === "subscribe" &&
      verifyToken === expectedVerifyToken &&
      challenge
    ) {
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return NextResponse.json(
      {
        message: "Webhook verification failed.",
      },
      {
        status: 403,
      },
    );
  } catch (error) {
    console.error(
      "WhatsApp webhook verification error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Webhook is not configured.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * Meta will POST WhatsApp events here.
 *
 * For now we only acknowledge them.
 * Later we'll process:
 * - sent
 * - delivered
 * - read
 * - failed
 * - incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      "WhatsApp webhook event:",
      JSON.stringify(body),
    );

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "WhatsApp webhook processing error:",
      error,
    );

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 400,
      },
    );
  }
}