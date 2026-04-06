import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

// ─── Subscriber Schemas ──────────────────────────────────────────────────────

export const addSubscriberSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  name: z
    .string()
    .max(100, "Name must be less than 100 characters")
    .optional()
    .transform((v) => v?.trim() || undefined),
  tags: z.array(z.string()).optional(),
});

export const importSubscribersSchema = z.object({
  subscribers: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .min(1, "At least one subscriber is required")
    .max(10000, "Maximum 10,000 subscribers per import"),
});

// ─── Newsletter Schemas ──────────────────────────────────────────────────────

export const newsletterSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  previewText: z
    .string()
    .max(300, "Preview text must be less than 300 characters")
    .optional(),
  content: z.any().optional(),
  htmlContent: z.string().optional(),
});

export const scheduleNewsletterSchema = z.object({
  scheduledAt: z
    .string()
    .datetime("Please enter a valid date and time")
    .refine(
      (date) => new Date(date) > new Date(),
      "Scheduled time must be in the future"
    ),
});

// ─── Settings Schemas ────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    )
    .optional(),
  brandName: z
    .string()
    .max(100, "Brand name must be less than 100 characters")
    .optional(),
  senderName: z
    .string()
    .max(100, "Sender name must be less than 100 characters")
    .optional(),
  senderEmail: z.string().email("Please enter a valid email").optional(),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
});

// ─── Template Schemas ────────────────────────────────────────────────────────

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters"),
  content: z.any(),
});

// ─── Public Subscribe Schema ─────────────────────────────────────────────────

export const publicSubscribeSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  name: z.string().max(100).optional(),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddSubscriberInput = z.infer<typeof addSubscriberSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type PublicSubscribeInput = z.infer<typeof publicSubscribeSchema>;
