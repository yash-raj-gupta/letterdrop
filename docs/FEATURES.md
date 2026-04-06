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
│   └── validations.ts    # Zod schemas
└── types/
    └── next-auth.d.ts    # NextAuth type augmentation
```
