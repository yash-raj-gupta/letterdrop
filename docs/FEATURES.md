# LetterDrop - Features Documentation

## Phase 1 (MVP) - Implemented

### 1. Authentication System
**Files:** `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/app/api/auth/`

- **Email + Password Registration** with bcrypt hashing (12 rounds)
- **Google OAuth** via NextAuth.js
- **JWT Session Strategy** (30-day expiry)
- **Server-side session helpers** (`getSession`, `getCurrentUser`, `requireAuth`)
- **Password validation**: min 8 chars, uppercase, lowercase, number
- **Protected routes**: Dashboard and all `/dashboard/*` routes require auth

---

### 2. Landing Page
**File:** `src/app/page.tsx`

- Sticky navigation with blur backdrop
- Hero section with gradient text and CTA buttons
- Social proof stats bar
- Feature cards (6 features) with hover effects
- "How It Works" 3-step section
- Pricing table with 4 tiers (Free, Starter, Growth, Pro)
- Call-to-action section
- Full footer with links

---

### 3. Auth Pages
**Files:** `src/app/(auth)/`, `src/components/auth/`

- **Login page**: Email/password form, Google OAuth button, password visibility toggle
- **Register page**: Full validation, password strength indicators, auto-login after registration
- **Split-screen layout**: Branding panel on left (desktop), form on right
- **Responsive**: Mobile-first with hidden branding panel on small screens

---

### 4. Dashboard Layout
**Files:** `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/sidebar.tsx`

- **Fixed sidebar** (desktop) with logo, nav links, user menu
- **Mobile navigation** with slide-out sheet
- **Active link highlighting**
- **User avatar with dropdown** (settings, logout)
- **"New Newsletter" quick action** button in sidebar

---

### 5. Dashboard Overview
**File:** `src/app/(dashboard)/dashboard/page.tsx`

- **4 stat cards**: Total subscribers, Newsletters sent, Avg. open rate, Growth
- **Recent newsletters list** with status badges and send counts
- **Recent subscribers list** with timestamps
- **Empty states** with CTAs when no data exists

---

### 6. Subscriber Management
**Files:** `src/app/api/subscribers/route.ts`, `src/components/dashboard/subscribers-view.tsx`

- **List subscribers** with pagination (25 per page)
- **Search** by email or name (debounced)
- **Filter** by status (Active, Unsubscribed, Bounced, Pending)
- **Add subscriber** via modal dialog
- **Bulk delete** with multi-select checkboxes
- **Tag management** per subscriber (expand row to manage tags)
- **Source tracking** (Form, Import, Manual, API)

---

### 7. Newsletter Editor
**Files:** `src/components/dashboard/newsletter-editor.tsx`, `src/app/api/newsletters/`

- **Subject line** and **preview text** inputs
- **HTML content editor** with toolbar (formatting buttons)
- **Write/Preview tabs** with live HTML preview
- **Auto-save** with Cmd+S keyboard shortcut
- **Send flow** with confirmation dialog

---

### 8. Newsletter Sending
**File:** `src/app/api/newsletters/[id]/send/route.ts`

- **Send to all active subscribers** with confirmation
- **Schedule for later** (optional `scheduledAt` parameter)
- **Send records** created per subscriber for tracking
- **Status progression**: DRAFT -> SENDING -> SENT

---

### 9. Newsletter Statistics
**File:** `src/app/(dashboard)/dashboard/newsletters/[id]/page.tsx`

- **4 stat cards**: Recipients, Delivered, Opens (%), Clicks (%)
- **Content preview** in email-like container
- **Timeline** showing creation and send dates

---

### 10. Settings Page
**Files:** `src/components/dashboard/settings-view.tsx`, `src/app/api/settings/route.ts`

- **Profile settings**: Name, email (read-only), username, bio
- **Newsletter settings**: Brand name, sender name, sender email
- **Plan info**: Current plan display with limits

---

### 11. Templates Page
**File:** `src/app/(dashboard)/dashboard/templates/page.tsx`

- **Template listing** with grid view
- **Empty state** for new users

---

## Phase 2 (Growth) - Implemented

### 12. Newsletter Scheduling
**File:** `src/app/api/newsletters/schedule/route.ts`

- **Cron endpoint** to process scheduled newsletters
- **Health check** GET endpoint for monitoring
- **Protected by CRON_SECRET** header authentication
- **Batch processing** of all due newsletters

**API Endpoints:**
- `POST /api/newsletters/schedule` - Process scheduled newsletters (cron)
- `GET /api/newsletters/schedule` - Health check / count pending

---

### 13. Tag Manager
**File:** `src/components/dashboard/tag-manager.tsx`

- **Create tags** with custom names and colors
- **10 predefined colors** to choose from
- **Delete tags** with confirmation (removes from all subscribers)
- **Assign/remove tags** per subscriber with toggle
- **Subscriber count** per tag
- **Integrated** into subscribers table via expandable row

---

## Phase 3 (Pro) - Implemented

### 14. Stripe Billing Integration
**Files:** `src/lib/stripe/config.ts`, `src/app/api/stripe/`, `src/app/api/billing/`

- **Stripe Checkout** for subscription purchases
- **Customer portal** for managing subscriptions
- **Webhook handling** for lifecycle events (checkout, update, delete, payment failure)
- **Plan tiers**: Starter ($9), Growth ($29), Pro ($79)
- **Subscription status tracking** (active, past_due, canceled, etc.)
- **Automatic plan upgrades/downgrades** via webhooks

**API Endpoints:**
- `POST /api/stripe/checkout-session` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/billing/portal` - Customer portal access

---

### 15. Advanced Analytics Dashboard
**Files:** `src/app/api/analytics/route.ts`, `src/app/(dashboard)/dashboard/analytics/page.tsx`, `src/components/dashboard/analytics-view.tsx`

- **Interactive charts** using Recharts
- **Subscriber growth** bar chart (daily breakdown, active vs unsubscribed)
- **Newsletter activity** line chart
- **Engagement breakdown** pie chart (opened, clicked, unopened)
- **Time range filtering** (7/30/90 days)
- **Overview stat cards**: Subscribers, Emails Sent, Open Rate, Click Rate

---

### 16. API Keys for Programmatic Access
**File:** `src/app/api/api-keys/route.ts`

- **Generate API keys** with custom names (format: `ld_<64-hex>`)
- **Expiration dates** optional
- **Secure hashing** (SHA-256) stored in database
- **One-time display** (key shown only once after creation)
- **Revoke keys** anytime
- **Limit**: 10 API keys per user

**API Endpoints:**
- `GET /api/api-keys` - List all API keys
- `POST /api/api-keys` - Create new API key
- `DELETE /api/api-keys?id=...` - Delete API key

---

### 17. Export Functionality
**File:** `src/app/api/export/subscribers/route.ts`

- **Export subscribers** to CSV or JSON
- **Filter by status** (optional)
- **Authentication** via session or API key (Bearer token)
- **Include all fields**: email, name, status, source, tags, dates

**API Endpoints:**
- `GET /api/export/subscribers?format=csv|json` - Export subscribers

---

### 18. Custom Fields
**File:** `src/app/api/custom-fields/route.ts`

- **Create custom fields** with validation (TEXT, NUMBER, DATE, SELECT, MULTISELECT, BOOLEAN)
- **Key format**: lowercase, alphanumeric, underscores
- **Options support** for SELECT/MULTISELECT types
- **Required flag** for mandatory fields
- **Limit**: 20 custom fields per user

**API Endpoints:**
- `GET /api/custom-fields` - List custom fields
- `POST /api/custom-fields` - Create custom field
- `DELETE /api/custom-fields?id=...` - Delete custom field

---

### 19. Automations Engine
**Files:** `src/app/api/automations/route.ts`, `src/lib/automations/trigger.ts`

- **Trigger-based automations** with configurable actions
- **7 trigger types**: Subscribe, Unsubscribe, Tag Added, Tag Removed, Email Opened, Link Clicked, Date Reached
- **5 action types**: Send Email, Add Tag, Remove Tag, Wait, Webhook
- **Sequential action execution** with delay support
- **Trigger data matching** for conditional execution
- **Toggle active/inactive** status
- **Limit**: 20 automations per user

**API Endpoints:**
- `GET /api/automations` - List automations
- `POST /api/automations` - Create automation
- `PATCH /api/automations` - Toggle active status
- `DELETE /api/automations?id=...` - Delete automation

---

### 20. Webhook Delivery System
**File:** `src/lib/webhooks/deliver.ts`

- **HMAC-SHA256 signed** webhook payloads
- **Automatic retry** with fail count tracking
- **Auto-disable** after 10 consecutive failures
- **10-second timeout** per delivery
- **Common event types**: subscriber.created, newsletter.sent, email.opened, etc.

**Webhook Events:**
- `subscriber.created` / `subscriber.deleted` / `subscriber.unsubscribed`
- `newsletter.sent`
- `email.opened` / `email.clicked`
- `tag.added` / `tag.removed`

---

## Database Schema

### Models
| Model | Description |
|-------|-------------|
| `User` | User accounts with auth, profile, and Stripe billing data |
| `Account` | OAuth provider accounts (Google) |
| `Session` | User sessions |
| `VerificationToken` | Email verification tokens |
| `Subscriber` | Email subscribers per user |
| `Tag` | Subscriber tags/labels |
| `SubscriberTag` | Many-to-many junction table |
| `Newsletter` | Newsletter drafts and sent issues |
| `Send` | Individual send records per newsletter/subscriber |
| `TrackingEvent` | Open/click tracking events |
| `Template` | Reusable newsletter templates |
| `ApiKey` | API keys for programmatic access |
| `CustomField` | Custom subscriber fields |
| `CustomFieldValue` | Custom field values per subscriber |
| `Automation` | Automation workflows |
| `AutomationAction` | Actions within automations |
| `Webhook` | Webhook endpoints |

### Enums
- `Plan`: FREE, STARTER, GROWTH, PRO
- `SubscriptionStatus`: INCOMPLETE, INCOMPLETE_EXPIRED, TRIALING, ACTIVE, PAST_DUE, CANCELED, UNPAID, PAUSED
- `SubscriberStatus`: ACTIVE, UNSUBSCRIBED, BOUNCED, PENDING
- `SubscriberSource`: FORM, IMPORT, MANUAL, API
- `NewsletterStatus`: DRAFT, SCHEDULED, SENDING, SENT
- `SendStatus`: QUEUED, SENT, DELIVERED, BOUNCED, FAILED
- `EventType`: OPEN, CLICK
- `CustomFieldType`: TEXT, NUMBER, DATE, SELECT, MULTISELECT, BOOLEAN
- `AutomationTrigger`: SUBSCRIBE, UNSUBSCRIBE, TAG_ADDED, TAG_REMOVED, EMAIL_OPENED, LINK_CLICKED, DATE_REACHED
- `AutomationActionType`: SEND_EMAIL, ADD_TAG, REMOVE_TAG, WAIT, WEBHOOK

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (pooled) |
| `DIRECT_URL` | Yes | PostgreSQL direct connection (migrations) |
| `NEXTAUTH_SECRET` | Yes | JWT encryption secret |
| `NEXTAUTH_URL` | Yes | App URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `RESEND_API_KEY` | No | Resend email service API key |
| `RESEND_FROM_EMAIL` | No | Sender email address |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_APP_NAME` | No | Display name |
| `CRON_SECRET` | No | Secret for cron endpoint auth |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_PRICE_STARTER` | No | Stripe price ID for Starter plan |
| `STRIPE_PRICE_GROWTH` | No | Stripe price ID for Growth plan |
| `STRIPE_PRICE_PRO` | No | Stripe price ID for Pro plan |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |

---

## Project Structure (Final)

```
src/
├── app/
│   ├── (auth)/           # Auth pages
│   ├── (dashboard)/      # Dashboard pages
│   │   ├── dashboard/
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── automations/   # Automations management
│   │   │   ├── billing/       # Billing management
│   │   │   ├── newsletters/
│   │   │   ├── subscribers/
│   │   │   ├── templates/
│   │   │   └── settings/
│   │   └── ...
│   ├── (public)/         # Public pages
│   ├── api/              # API routes
│   │   ├── analytics/         # Analytics data
│   │   ├── api-keys/          # API key management
│   │   ├── automations/       # Automations CRUD
│   │   ├── billing/           # Billing portal
│   │   ├── custom-fields/     # Custom fields CRUD
│   │   ├── export/            # Export functionality
│   │   ├── newsletters/       # Newsletter CRUD + send + schedule
│   │   ├── stripe/            # Stripe integration
│   │   └── ...
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── analytics-view.tsx    # Analytics charts
│   │   ├── csv-import-dialog.tsx
│   │   ├── newsletter-editor.tsx
│   │   ├── subscribers-view.tsx
│   │   ├── tag-manager.tsx       # Tag management
│   │   └── templates-view.tsx
│   └── ...
├── lib/
│   ├── automations/      # Automation trigger engine
│   │   └── trigger.ts
│   ├── email/            # Email sending
│   ├── stripe/           # Stripe configuration
│   │   └── config.ts
│   ├── webhooks/         # Webhook delivery
│   │   └── deliver.ts
│   └── ...
└── ...
```

---

## Next Steps (Future Enhancements)

- **Team collaboration** (multi-user accounts)
- **Advanced segmentation** (custom fields rules-based filtering)
- **A/B testing** (subject lines, content)
- **Custom domains** for public pages
- **Zapier/Make integration**
- **Mobile app**
- **Dark mode** for newsletter themes
- **Advanced template editor** (drag & drop)
