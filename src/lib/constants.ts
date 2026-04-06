export const APP_NAME = "LetterDrop";
export const APP_DESCRIPTION =
  "The simplest way to build your email audience and send beautiful newsletters.";

// Plan limits
export const PLAN_LIMITS = {
  FREE: {
    maxSubscribers: 500,
    maxEmailsPerMonth: 1000,
    features: ["Basic editor", "Public archive", "Email support"],
  },
  STARTER: {
    maxSubscribers: 2500,
    maxEmailsPerMonth: -1, // unlimited
    features: [
      "Everything in Free",
      "Custom templates",
      "Scheduling",
      "CSV import",
    ],
  },
  GROWTH: {
    maxSubscribers: 10000,
    maxEmailsPerMonth: -1,
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Priority support",
      "Tags & segments",
    ],
  },
  PRO: {
    maxSubscribers: 50000,
    maxEmailsPerMonth: -1,
    features: [
      "Everything in Growth",
      "Custom domain",
      "API access",
      "Dedicated support",
    ],
  },
} as const;

// Subscriber sources display labels
export const SOURCE_LABELS = {
  FORM: "Sign-up form",
  IMPORT: "CSV import",
  MANUAL: "Manual",
  API: "API",
} as const;

// Newsletter status display labels
export const STATUS_LABELS = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  SENDING: "Sending",
  SENT: "Sent",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
