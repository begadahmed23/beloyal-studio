import { NextRequest, NextResponse } from "next/server";

import { sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-whatsapp-test-secret");

    if (
      !process.env.WHATSAPP_TEST_SECRET ||
      secret !== process.env.WHATSAPP_TEST_SECRET
    ) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { message: "Phone number is required." },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppText(
      phone,
      "Hello from BeLoyal + Loretto 👋",
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("WhatsApp test error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "WhatsApp test failed.",
      },
      { status: 500 },
    );
  }
}