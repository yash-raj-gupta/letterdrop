import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE)))
    );
    const status = searchParams.get("status") ?? "";

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (
      status &&
      ["DRAFT", "SCHEDULED", "SENDING", "SENT"].includes(status)
    ) {
      where.status = status;
    }

    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          previewText: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { sends: true } },
        },
      }),
      prisma.newsletter.count({ where }),
    ]);

    return successResponse({
      newsletters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = newsletterSchema.parse(body);

    // Generate slug from subject
    const slug = validated.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    // Ensure unique slug
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await prisma.newsletter.findUnique({
        where: {
          userId_slug: {
            userId: session.user.id,
            slug: finalSlug,
          },
        },
      });
      if (!existing) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        userId: session.user.id,
        subject: validated.subject,
        previewText: validated.previewText,
        content: validated.content,
        htmlContent: validated.htmlContent,
        slug: finalSlug,
        status: "DRAFT",
      },
    });

    return successResponse(newsletter, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
