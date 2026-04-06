import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}?error=invalid-token`);
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { confirmToken: token },
      include: {
        user: {
          select: { username: true, brandName: true, name: true },
        },
      },
    });

    if (!subscriber) {
      return NextResponse.redirect(`${APP_URL}?error=invalid-token`);
    }

    if (subscriber.status === "ACTIVE") {
      // Already confirmed
      const redirectUrl = subscriber.user.username
        ? `${APP_URL}/${subscriber.user.username}?confirmed=already`
        : `${APP_URL}?confirmed=already`;
      return NextResponse.redirect(redirectUrl);
    }

    // Confirm subscription
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: new Date(),
        subscribedAt: new Date(),
        confirmToken: null,
      },
    });

    // Redirect to public page with success message
    const redirectUrl = subscriber.user.username
      ? `${APP_URL}/${subscriber.user.username}?confirmed=true`
      : `${APP_URL}?confirmed=true`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[Confirm Subscription Error]", error);
    return NextResponse.redirect(`${APP_URL}?error=confirmation-failed`);
  }
}
