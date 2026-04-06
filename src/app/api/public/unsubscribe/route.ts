import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token"); // subscriber ID
  const newsletterId = searchParams.get("nl");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}?error=invalid-link`);
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: token },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!subscriber) {
      return NextResponse.redirect(`${APP_URL}?error=invalid-link`);
    }

    // Unsubscribe
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // Redirect to a confirmation page
    return NextResponse.redirect(`${APP_URL}/unsubscribed`);
  } catch (error) {
    console.error("[Unsubscribe Error]", error);
    return NextResponse.redirect(`${APP_URL}?error=unsubscribe-failed`);
  }
}

// Support POST for List-Unsubscribe-Post header (one-click unsubscribe)
export async function POST(request: NextRequest) {
  return GET(request);
}
