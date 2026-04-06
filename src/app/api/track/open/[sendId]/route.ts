import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  try {
    const { sendId } = await params;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Update send record with open timestamp (only first open)
    await prisma.send.updateMany({
      where: {
        id: sendId,
        openedAt: null,
      },
      data: {
        openedAt: new Date(),
      },
    });

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        sendId,
        type: "OPEN",
        ip,
        userAgent,
      },
    });
  } catch (error) {
    // Silently fail - don't break email rendering
    console.error("[Tracking Pixel Error]", error);
  }

  // Return the 1x1 transparent GIF
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
