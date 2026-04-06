---

## Phase 3 - Implemented

### 22. Stripe Billing Integration
**Files:** `src/lib/stripe/`, `src/app/api/stripe/`, `src/app/api/billing/`

- **Stripe Checkout** for subscription purchases
- **Customer portal** for managing subscriptions
- **Webhook handling** for lifecycle events
- **Plan tiers**: Starter ($9), Growth ($29), Pro ($79)
- **Subscription status tracking** (active, past_due, canceled)
- **Automatic plan upgrades/downgrades**

**API Endpoints:**
- `POST /api/stripe/checkout-session` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/billing/portal` - Customer portal access

**Environment Variables:**
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PRICE_STARTER="price_..."
STRIPE_PRICE_GROWTH="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

### 23. Advanced Analytics Dashboard
**Files:** `src/app/api/analytics/`, `src/app/(dashboard)/dashboard/analytics/`, `src/components/dashboard/analytics-view.tsx`

- **Interactive charts** using Recharts
- **Subscriber growth** bar chart (daily breakdown)
- **Newsletter activity** line chart
- **Engagement breakdown** pie chart
- **Time range filtering** (7/30/90 days)
- **Real metrics**: open rate, click rate, subscriber count

**Chart Types:**
- Bar chart for subscriber growth
- Line chart for newsletter sends
- Pie chart for engagement rates

---

### 24. API Keys for Programmatic Access
**Files:** `src/app/api/api-keys/`, `src/app/api/export/`

- **Generate API keys** with custom names
- **Expiration dates** optional
- **Secure hashing** (SHA-256) stored in database
- **One-time display** (key shown only once after creation)
- **Revoke keys** anytime
- **Export data** via API (subscribers in CSV/JSON)

**API Endpoints:**
- `GET /api/api-keys` - List all API keys
- `POST /api/api-keys` - Create new API key
- `DELETE /api/api-keys?id=...` - Delete API key
- `GET /api/export/subscribers?format=csv|json` - Export data

**Key Format:**
```
ld_<64-char-hex>
```

---

### 25. Export Functionality
**Files:** `src/app/api/export/`

- **Export subscribers** to CSV or JSON
- **Filter by status** (optional)
- **Include all fields**: email, name, status, source, tags, dates
- **CSV headers** properly formatted
- **JSON pretty-printed**

**Usage:**
```bash
curl "https://yourapp.com/api/export/subscribers?format=csv" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Routes (34 Total)

### New Dashboard Routes
| Route | Description |
|-------|-------------|
| `/dashboard/analytics` | Advanced analytics with charts |
| `/dashboard/billing` | Billing and subscription management |

### New API Routes
| Route | Description |
|-------|-------------|
| `/api/stripe/checkout-session` | Create Stripe checkout |
| `/api/stripe/webhook` | Stripe webhook handler |
| `/api/billing/portal` | Customer portal |
| `/api/api-keys` | API key management |
| `/api/analytics` | Analytics data |
| `/api/export/subscribers` | Export subscribers |

---

## Database Schema Updates

### User Model Updates
```prisma
model User {
  // ... existing fields ...
  
  // Stripe billing fields
  stripeCustomerId     String?              @unique
  stripeSubscriptionId String?
  stripePriceId        String?
  subscriptionStatus   SubscriptionStatus   @default(INCOMPLETE)
  currentPeriodEnd     DateTime?
  
  apiKeys              ApiKey[]
}

model ApiKey {
  id         String    @id @default(cuid())
  userId     String
  name       String
  key        String    @unique
  lastUsedAt DateTime?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum SubscriptionStatus {
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}
```

---

## Updated Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | No | Stripe secret key (for billing) |
| `STRIPE_PRICE_STARTER` | No | Stripe price ID for Starter plan |
| `STRIPE_PRICE_GROWTH` | No | Stripe price ID for Growth plan |
| `STRIPE_PRICE_PRO` | No | Stripe price ID for Pro plan |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

---

## Project Structure (Final)

```
src/
├── app/
│   ├── (auth)/           # Auth pages
│   ├── (dashboard)/      # Dashboard pages
│   │   ├── dashboard/
│   │   │   ├── analytics/     # NEW: Analytics dashboard
│   │   │   ├── billing/       # NEW: Billing management
│   │   │   ├── newsletters/
│   │   │   ├── subscribers/
│   │   │   ├── templates/
│   │   │   └── settings/
│   │   └── ...
│   ├── (public)/         # Public pages
│   ├── api/              # API routes
│   │   ├── analytics/         # NEW: Analytics data
│   │   ├── api-keys/          # NEW: API key management
│   │   ├── billing/           # NEW: Billing portal
│   │   ├── export/            # NEW: Export functionality
│   │   ├── stripe/            # NEW: Stripe integration
│   │   └── ...
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── analytics-view.tsx    # NEW: Analytics charts
│   │   ├── csv-import-dialog.tsx
│   │   ├── newsletter-editor.tsx
│   │   ├── subscribers-view.tsx
│   │   ├── tag-manager.tsx
│   │   └── templates-view.tsx
│   └── ...
├── lib/
│   ├── stripe/           # NEW: Stripe configuration
│   │   ├── config.ts
│   │   └── ...
│   └── ...
└── ...
```

---

## Feature Summary

### Phase 1 (MVP)
- Authentication (email + Google OAuth)
- Dashboard with sidebar navigation
- Subscriber management (CRUD, CSV import)
- Newsletter editor and sending
- Template management
- Basic analytics
- Public archive pages

### Phase 2 (Growth)
- Resend email integration
- Open/click tracking
- Double opt-in subscriptions
- Unsubscribe handling
- Newsletter scheduling
- Subscriber tags
- CSV import with validation

### Phase 3 (Pro)
- Stripe billing integration
- Advanced analytics with charts
- API keys for programmatic access
- Export functionality (CSV/JSON)
- Subscription management
- Webhook handling

---

## Next Steps (Future Enhancements)

### Potential Phase 4 Features
- **Team collaboration** (multi-user accounts)
- **Advanced segmentation** (custom fields, rules)
- **Automations** (welcome series, drip campaigns)
- **A/B testing** (subject lines, content)
- **Custom domains** for public pages
- **Webhooks** for external integrations
- **Zapier/Make integration**
- **Mobile app**
- **Dark mode** for newsletter themes
- **Advanced template editor** (drag & drop)
