import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated session on the server.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current authenticated user from the database.
 * Redirects to /login if not authenticated.
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      brandName: true,
      senderName: true,
      senderEmail: true,
      bio: true,
      plan: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use at the top of server components that require auth.
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}
