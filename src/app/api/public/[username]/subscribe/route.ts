import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicSubscribeSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { nanoid } from "nanoid";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { confirmationEmailHtml } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const body = await request.json();
    const validated = publicSubscribeSchema.parse(body);

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, brandName: true, name: true, senderName: true },
    });

    if (!user) {
      return errorResponse("Newsletter not found", 404);
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: {
        userId_email: {
          userId: user.id,
          email: validated.email,
        },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return successResponse({
          message: "You're already subscribed!",
          requiresConfirmation: false,
        });
      }

      if (existing.status === "UNSUBSCRIBED") {
        // Re-subscribe
        await prisma.subscriber.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            unsubscribedAt: null,
            subscribedAt: new Date(),
          },
        });

        return successResponse({
          message: "Welcome back! You've been re-subscribed.",
          requiresConfirmation: false,
        });
      }

      if (existing.status === "PENDING") {
        return successResponse({
          message: "Check your email to confirm your subscription.",
          requiresConfirmation: true,
        });
      }
    }

    // Create subscriber with double opt-in
    const confirmToken = nanoid(32);
    const brandName = user.brandName || user.senderName || user.name || "Newsletter";

    await prisma.subscriber.create({
      data: {
        userId: user.id,
        email: validated.email,
        name: validated.name,
        source: "FORM",
        status: "PENDING",
        confirmToken,
      },
    });

    // Send confirmation email
    const confirmUrl = `${APP_URL}/api/subscribers/confirm?token=${confirmToken}`;

    await sendTransactionalEmail({
      to: validated.email,
      subject: `Confirm your subscription to ${brandName}`,
      html: confirmationEmailHtml({ brandName, confirmUrl }),
    });

    return successResponse({
      message: "Check your email to confirm your subscription!",
      requiresConfirmation: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
