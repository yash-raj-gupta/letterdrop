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

**Integration Steps for Google OAuth:**
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add redirect URI: `{APP_URL}/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

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
**Files:** `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/sidebar.tsx`, `src/components/dashboard/mobile-nav.tsx`

- **Fixed sidebar** (desktop) with logo, nav links, user menu
- **Mobile navigation** with slide-out sheet
- **Active link highlighting**
- **User avatar with dropdown** (settings, logout)
- **"New Newsletter" quick action** button in sidebar

**Navigation Items:**
- Dashboard (overview)
- Newsletters
- Subscribers
- Templates
- Settings

---

### 5. Dashboard Overview
**File:** `src/app/(dashboard)/dashboard/page.tsx`

- **4 stat cards**: Total subscribers, Newsletters sent, Avg. open rate, Growth
- **Recent newsletters list** with status badges and send counts
- **Recent subscribers list** with timestamps
- **Empty states** with CTAs when no data exists
- **Real-time stats** from database aggregation

---

### 6. Subscriber Management
**Files:** `src/app/api/subscribers/route.ts`, `src/components/dashboard/subscribers-view.tsx`

- **List subscribers** with pagination (25 per page)
- **Search** by email or name (debounced)
- **Filter** by status (Active, Unsubscribed, Bounced, Pending)
- **Add subscriber** via modal dialog
- **Bulk delete** with multi-select checkboxes
- **Individual delete** via dropdown menu
- **Status badges** with color coding
- **Source tracking** (Form, Import, Manual, API)
- **Responsive table** with hidden columns on mobile

**API Endpoints:**
- `GET /api/subscribers` - List with pagination, search, filter
- `POST /api/subscribers` - Add single subscriber
- `DELETE /api/subscribers?ids=...` - Bulk delete

---

### 7. Newsletter Editor
**Files:** `src/components/dashboard/newsletter-editor.tsx`, `src/app/api/newsletters/`

- **Subject line** and **preview text** inputs
- **HTML content editor** with toolbar (formatting buttons)
- **Write/Preview tabs** with live HTML preview
- **Auto-save** with Cmd+S keyboard shortcut
- **Draft saving** (creates new or updates existing)
- **Send flow** with confirmation dialog
- **URL rewriting** on save (updates browser URL without navigation)

**Toolbar Features:**
Bold, Italic, Underline, H1, H2, Lists, Blockquote, Links, Images, Dividers, Alignment

**API Endpoints:**
- `GET /api/newsletters` - List with pagination and status filter
- `POST /api/newsletters` - Create new draft
- `GET /api/newsletters/[id]` - Get single newsletter
- `PATCH /api/newsletters/[id]` - Update newsletter
- `DELETE /api/newsletters/[id]` - Delete newsletter
- `POST /api/newsletters/[id]/send` - Send or schedule

---

### 8. Newsletter Sending
**File:** `src/app/api/newsletters/[id]/send/route.ts`

- **Send to all active subscribers** with confirmation
- **Schedule for later** (optional `scheduledAt` parameter)
- **Send records** created per subscriber for tracking
- **Status progression**: DRAFT -> SENDING -> SENT
- **Validation**: Must have content and active subscribers

> **Note:** Currently simulates sending. Resend integration needed for production. See `docs/SETUP.md` for Resend setup.

---

### 9. Newsletter Statistics
**File:** `src/app/(dashboard)/dashboard/newsletters/[id]/page.tsx`

- **4 stat cards**: Recipients, Delivered, Opens (%), Clicks (%)
- **Content preview** in email-like container
- **Timeline** showing creation and send dates
- **Status badge** display

---

### 10. Settings Page
**Files:** `src/components/dashboard/settings-view.tsx`, `src/app/api/settings/route.ts`

- **Profile settings**: Name, email (read-only), username, bio
- **Newsletter settings**: Brand name, sender name, sender email
- **Plan info**: Current plan display with limits and upgrade CTA
- **Username validation**: Lowercase, alphanumeric, hyphens, underscores only

---

### 11. Templates Page
**File:** `src/app/(dashboard)/dashboard/templates/page.tsx`

- **Template listing** with grid view
- **Empty state** for new users
- **Template cards** with preview placeholder and timestamps

---

## Database Schema

### Models
| Model | Description |
|-------|-------------|
| `User` | User accounts with auth and profile data |
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

### Enums
- `Plan`: FREE, STARTER, GROWTH, PRO
- `SubscriberStatus`: ACTIVE, UNSUBSCRIBED, BOUNCED, PENDING
- `SubscriberSource`: FORM, IMPORT, MANUAL, API
- `NewsletterStatus`: DRAFT, SCHEDULED, SENDING, SENT
- `SendStatus`: QUEUED, SENT, DELIVERED, BOUNCED, FAILED
- `EventType`: OPEN, CLICK

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── api/              # API route handlers
│   │   ├── auth/         # NextAuth + register
│   │   ├── newsletters/  # Newsletter CRUD + send
│   │   ├── settings/     # User settings
│   │   └── subscribers/  # Subscriber CRUD
│   ├── globals.css
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Landing page
├── components/
│   ├── auth/             # Login/register forms
│   ├── dashboard/        # Dashboard-specific components
│   ├── providers/        # Context providers
│   ├── shared/           # Shared components
│   └── ui/               # shadcn/ui components
├── generated/
│   └── prisma/           # Generated Prisma client
├── lib/
│   ├── api-response.ts   # API response helpers
│   ├── auth-helpers.ts   # Server-side auth utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── constants.ts      # App constants and plan limits
│   ├── prisma.ts         # Prisma client singleton
│   ├── utils.ts          # Utility functions (cn)
│   ├── validations.ts    # Zod schemas
│   └── email/            # Email sending & templates
│       ├── resend.ts     # Resend client configuration
│       ├── sender.ts     # Email sending logic
│       └── templates.ts  # Email templates
└── types/
    └── next-auth.d.ts    # NextAuth type augmentation
```

---

## Phase 2 - Implemented

### 12. Resend Email Integration
**Files:** `src/lib/email/`, `src/app/api/newsletters/[id]/send/`

- **Production email sending** via Resend API
- **Graceful fallback** to simulation when Resend is not configured
- **Responsive HTML email templates** with brand customization
- **List-Unsubscribe headers** for email client compatibility
- **Batch processing** (10 emails per batch) with rate limiting
- **Tracking pixel injection** and **link rewriting** for analytics

**Email Templates:**
- Newsletter wrapper with header, content, footer, unsubscribe link
- Double opt-in confirmation email
- Responsive design with mobile-first CSS

**Integration Steps:**
1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env`
4. Verify sender domain (add DNS records)

---

### 13. CSV Subscriber Import
**Files:** `src/app/api/subscribers/import/route.ts`, `src/components/dashboard/csv-import-dialog.tsx`

- **File upload** (CSV/TXT, max 5MB)
- **Paste text** alternative for quick imports
- **Auto-detect headers** (email, name columns)
- **Email validation** with detailed error reporting
- **Duplicate detection** against existing subscribers
- **Batch import** (max 10,000 per import, 500 per batch insert)
- **Import results summary** (imported, duplicates, errors)

**Supported CSV Formats:**
```
email,name
john@example.com,John Doe
jane@example.com,Jane Smith
bob@example.com
```

---

### 14. Template Management
**Files:** `src/app/api/templates/`, `src/components/dashboard/templates-view.tsx`

- **Create templates** with name and HTML content
- **Edit templates** inline
- **Duplicate templates** with "(Copy)" suffix
- **Delete templates** with confirmation
- **Visual preview** in template cards
- **Grid layout** with hover actions
- **Timestamp tracking** (updated "X time ago")

**Use Cases:**
- Weekly newsletter formats
- Product announcement templates
- Welcome series layouts
- Reusable design patterns

---

### 15. Email Analytics & Tracking
**Files:** `src/app/api/track/open/[sendId]/`, `src/app/api/track/click/[sendId]/`

- **Open tracking** via 1x1 transparent GIF pixel
- **Click tracking** via redirect URLs
- **IP tracking** for location insights
- **User agent tracking** for device/client analytics
- **Real-time database updates** on track events
- **Cache-busting headers** for accurate tracking

**Tracking Flow:**
1. Newsletter sent with unique tracking URLs
2. Recipients open email → pixel loads → tracked
3. Recipients click links → redirect → tracked → forwarded
4. Dashboard displays open/click rates per newsletter

---

### 16. Public Newsletter Archive
**Files:** `src/app/(public)/[username]/`, `src/app/(public)/[username]/[slug]/`

- **Public archive page** at `/{username}`
- **SEO-friendly** with dynamic metadata
- **Subscriber count display**
- **Subscribe CTA** integrated
- **Individual newsletter pages** at `/{username}/{slug}`
- **Reading-friendly layout** with clean typography
- **Subscribe CTA** at bottom of each newsletter

**Features:**
- Sticky header with brand logo
- Timeline of past issues
- Responsive design
- "Powered by LetterDrop" branding

---

### 17. Double Opt-In Subscription
**Files:** `src/app/api/public/[username]/subscribe/`, `src/app/api/subscribers/confirm/`

- **Hosted signup page** via public archive
- **Confirmation email** with secure token
- **Click-to-confirm** flow
- **Resubscribe support** for previously unsubscribed
- **Pending status** until confirmation
- **Confirmation landing page** with success message

**User Flow:**
1. Visitor enters email on public page
2. Email sent with confirmation link
3. User clicks link → account activated
4. Redirected to archive with confirmation message

---

### 18. Unsubscribe Handling
**Files:** `src/app/api/public/unsubscribe/`, `src/app/unsubscribed/page.tsx`

- **One-click unsubscribe** via email link
- **List-Unsubscribe-Post header** support
- **Status update** to UNSUBSCRIBED
- **Timestamp tracking** for unsubscribe date
- **Confirmation page** with friendly messaging
- **Resubscribe option** via public page

---

### 19. Newsletter Scheduling
**Files:** `src/app/api/newsletters/schedule/`, `src/app/api/newsletters/[id]/send/`

- **Schedule for later** with datetime picker
- **Cron endpoint** for automated checking
- **Batch processing** of due newsletters
- **Secret header protection** for cron security

**Setup for Scheduling:**
1. Set `CRON_SECRET` environment variable
2. Configure Vercel Cron or similar scheduler
3. Call `/api/newsletters/schedule` every 5-15 minutes

**Environment Variables:**
```env
CRON_SECRET="your-secret-here"
```

---

### 20. Subscriber Tags
**Files:** `src/app/api/tags/`, `src/components/dashboard/tag-manager.tsx`

- **Create tags** with custom colors (14 preset colors)
- **Delete tags** (removes from subscribers)
- **Tag count display** (X subscribers per tag)
- **Sidebar integration** in subscribers page
- **Future filtering** support (API ready)

**Tag Manager Features:**
- Visual color picker
- Subscriber count badges
- Hover-to-delete
- Quick create from sidebar

---

### 21. Send Analytics Dashboard
**Files:** `src/app/(dashboard)/dashboard/newsletters/[id]/page.tsx`

- **Recipients count**
- **Delivery rate** (100% on success)
- **Open rate** with percentage
- **Click rate** with percentage
- **Timeline** showing creation and send dates
- **Content preview** in email-like container

---

## Routes (29 Total)

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/[username]` | Public archive |
| `/[username]/[slug]` | Public newsletter view |
| `/unsubscribed` | Unsubscribe confirmation |

### Dashboard Routes (Protected)
| Route | Description |
|-------|-------------|
| `/dashboard` | Overview |
| `/dashboard/newsletters` | Newsletter list |
| `/dashboard/newsletters/new` | Create newsletter |
| `/dashboard/newsletters/[id]` | Newsletter stats |
| `/dashboard/newsletters/[id]/edit` | Edit newsletter |
| `/dashboard/subscribers` | Subscriber management |
| `/dashboard/templates` | Template management |
| `/dashboard/settings` | Account settings |

### API Routes
| Route | Description |
|-------|-------------|
| `/api/auth/[...nextauth]` | NextAuth handlers |
| `/api/auth/register` | Registration |
| `/api/newsletters` | Newsletter CRUD |
| `/api/newsletters/[id]/send` | Send newsletter |
| `/api/newsletters/schedule` | Cron check for scheduled |
| `/api/subscribers` | Subscriber CRUD |
| `/api/subscribers/import` | CSV import |
| `/api/subscribers/confirm` | Confirm subscription |
| `/api/tags` | Tag CRUD |
| `/api/templates` | Template CRUD |
| `/api/templates/[id]` | Template CRUD |
| `/api/settings` | Settings update |
| `/api/public/[username]/subscribe` | Public subscribe |
| `/api/public/unsubscribe` | Unsubscribe handler |
| `/api/track/open/[sendId]` | Open tracking pixel |
| `/api/track/click/[sendId]` | Click tracking redirect |

---

## Environment Variables (Complete)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooled connection |
| `DIRECT_URL` | Yes | Supabase direct connection |
| `NEXTAUTH_URL` | Yes | App base URL |
| `NEXTAUTH_SECRET` | Yes | JWT secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `RESEND_API_KEY` | No | Email sending (required for production) |
| `RESEND_FROM_EMAIL` | No | Sender email address |
| `CRON_SECRET` | No | Cron endpoint protection |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |

