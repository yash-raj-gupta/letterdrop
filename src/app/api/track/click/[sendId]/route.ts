import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const { sendId } = await params;
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
  }

  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Update send record with click timestamp (only first click)
    await prisma.send.updateMany({
      where: {
        id: sendId,
        clickedAt: null,
      },
      data: {
        clickedAt: new Date(),
      },
    });

    // Also mark as opened if not already
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
        type: "CLICK",
        url: targetUrl,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[Click Tracking Error]", error);
  }

  // Redirect to the original URL
  return NextResponse.redirect(targetUrl);
}
