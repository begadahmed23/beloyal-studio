import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const MAX_LOGO_SIZE = 4 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    const authData = await requireAuth(request.headers);

    if (!authData || authData.isSuperAdmin || !authData.cafeId) {
      return NextResponse.json(
        {
          error: "You are not authorized to upload a café logo.",
        },
        {
          status: 403,
        },
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("logo");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select a logo to upload.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_LOGO_TYPES.includes(uploadedFile.type)) {
      return NextResponse.json(
        {
          error: "Logo must be a PNG, JPG, or WebP image.",
        },
        {
          status: 400,
        },
      );
    }

    if (uploadedFile.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected logo file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (uploadedFile.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        {
          error: "Logo must be smaller than 4 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const cafe = await prisma.cafe.findUnique({
      where: {
        id: authData.cafeId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!cafe) {
      return NextResponse.json(
        {
          error: "Café not found.",
        },
        {
          status: 404,
        },
      );
    }

    const extension = FILE_EXTENSIONS[uploadedFile.type];

    const blob = await put(
      `cafes/${cafe.slug}/logo-${Date.now()}.${extension}`,
      uploadedFile,
      {
        access: "public",
        addRandomSuffix: true,
      },
    );

    const updatedCafe = await prisma.cafe.update({
      where: {
        id: cafe.id,
      },
      data: {
        logoUrl: blob.url,
      },
      select: {
        id: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({
      message: "Logo uploaded successfully.",
      logoUrl: updatedCafe.logoUrl,
    });
  } catch (error) {
    console.error("POST café logo error:", error);

    return NextResponse.json(
      {
        error: "Unable to upload the café logo.",
      },
      {
        status: 500,
      },
    );
  }
}