import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addSubscriberSchema } from "@/lib/validations";
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
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const tag = searchParams.get("tag") ?? "";

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING"].includes(status)) {
      where.status = status;
    }

    if (tag) {
      where.tags = { some: { tag: { name: tag } } };
    }

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: {
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriber.count({ where }),
    ]);

    return successResponse({
      subscribers,
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
    const validated = addSubscriberSchema.parse(body);

    // Check if subscriber already exists
    const existing = await prisma.subscriber.findUnique({
      where: {
        userId_email: {
          userId: session.user.id,
          email: validated.email,
        },
      },
    });

    if (existing) {
      return errorResponse("A subscriber with this email already exists", 409);
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        userId: session.user.id,
        email: validated.email,
        name: validated.name,
        source: "MANUAL",
        status: "ACTIVE",
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return successResponse(subscriber, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);

    if (!ids || ids.length === 0) {
      return errorResponse("No subscriber IDs provided", 400);
    }

    await prisma.subscriber.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return successResponse({ deleted: ids.length });
  } catch (error) {
    return handleApiError(error);
  }
}
