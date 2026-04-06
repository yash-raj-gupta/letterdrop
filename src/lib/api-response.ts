import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function errorResponse(
  error: string,
  status = 400,
  errors?: Record<string, string[]>
) {
  return NextResponse.json<ApiResponse>(
    { success: false, error, errors },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return errorResponse("Validation failed", 422, fieldErrors);
  }

  if (error instanceof Error) {
    // Don't leak internal error messages in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error";
    return errorResponse(message, 500);
  }

  return errorResponse("Internal server error", 500);
}
