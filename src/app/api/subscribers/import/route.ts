import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse CSV text into subscriber rows.
 * Supports: email,name or just email per line.
 * Handles headers automatically.
 */
function parseCsv(
  text: string
): { email: string; name?: string; error?: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Detect and skip header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("email") ||
    firstLine.includes("name") ||
    firstLine.includes("subscriber");
  const startIdx = hasHeader ? 1 : 0;

  const results: { email: string; name?: string; error?: string }[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Handle quoted CSV fields
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!parts || parts.length === 0) continue;

    const email = parts[0]
      .replace(/^"|"$/g, "")
      .trim()
      .toLowerCase();
    const name =
      parts.length > 1 ? parts[1].replace(/^"|"$/g, "").trim() : undefined;

    if (!emailRegex.test(email)) {
      results.push({ email, error: `Invalid email on line ${i + 1}` });
      continue;
    }

    results.push({ email, name: name || undefined });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const csvText = formData.get("csv") as string | null;

    let rawCsv: string;

    if (file) {
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
        return errorResponse("Please upload a .csv or .txt file", 400);
      }
      if (file.size > 5 * 1024 * 1024) {
        return errorResponse("File size must be under 5MB", 400);
      }
      rawCsv = await file.text();
    } else if (csvText) {
      rawCsv = csvText;
    } else {
      return errorResponse("No file or CSV data provided", 400);
    }

    const parsed = parseCsv(rawCsv);
    const errors = parsed.filter((r) => r.error);
    const valid = parsed.filter((r) => !r.error);

    if (valid.length === 0) {
      return errorResponse(
        errors.length > 0
          ? `No valid emails found. ${errors.length} error(s).`
          : "No subscribers found in the file",
        400
      );
    }

    if (valid.length > 10000) {
      return errorResponse("Maximum 10,000 subscribers per import", 400);
    }

    // Get existing subscriber emails for this user
    const existingEmails = new Set(
      (
        await prisma.subscriber.findMany({
          where: { userId: session.user.id },
          select: { email: true },
        })
      ).map((s) => s.email)
    );

    // Filter out duplicates
    const newSubscribers = valid.filter((s) => !existingEmails.has(s.email));
    const duplicateCount = valid.length - newSubscribers.length;

    if (newSubscribers.length === 0) {
      return successResponse({
        imported: 0,
        duplicates: duplicateCount,
        errors: errors.length,
        message: "All subscribers already exist in your list",
      });
    }

    // Batch insert
    const batchSize = 500;
    let totalImported = 0;

    for (let i = 0; i < newSubscribers.length; i += batchSize) {
      const batch = newSubscribers.slice(i, i + batchSize);

      const result = await prisma.subscriber.createMany({
        data: batch.map((sub) => ({
          userId: session.user.id,
          email: sub.email,
          name: sub.name,
          source: "IMPORT" as const,
          status: "ACTIVE" as const,
        })),
        skipDuplicates: true,
      });

      totalImported += result.count;
    }

    return successResponse({
      imported: totalImported,
      duplicates: duplicateCount,
      errors: errors.length,
      total: parsed.length,
      message: `Successfully imported ${totalImported} subscriber(s)`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
