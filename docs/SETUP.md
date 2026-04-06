# LetterDrop - Setup Guide

This guide walks you through setting up LetterDrop for local development and production.

---

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- (Optional) Google Cloud Console project for OAuth
- (Optional) Resend account for email sending
◊
---

## 1. Supabase Database Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose an organization, name your project (e.g., `letterdrop`)
4. Set a strong database password — **save this**, you'll need it
5. Choose a region close to your users
6. Click **"Create new project"**

### Step 2: Get Connection Strings

1. In your Supabase dashboard, go to **Settings > Database**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the following connection strings into your `.env` file:

```env
# Transaction mode (for Prisma Client) - Use the "Connection Pooling" URI with port 6543
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (for Prisma Migrate) - Use the direct connection URI with port 5432
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> **Important:** Replace `[YOUR-PASSWORD]` with the database password you set during project creation.

### Step 3: Run Migrations

```bash
npx prisma migrate dev --name init
```

This creates all the database tables defined in the Prisma schema.

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## 2. NextAuth Setup

### Generate a Secret

```bash
openssl rand -base64 32
```

Copy the output and set it as `NEXTAUTH_SECRET` in your `.env`:

```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 3. Google OAuth Setup (Optional)

If you want Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **"Create Credentials" > "OAuth 2.0 Client IDs"**
5. Set application type to **"Web application"**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env`:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

> **Note:** If you skip Google OAuth, users can still register and log in with email/password.

---

## 4. Resend Email Setup (Optional for development)

For sending actual emails in production:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your sending domain and verify it (DNS records)
4. Set the following in `.env`:

```env
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

> **Note:** In development, emails are not actually sent — the send flow is simulated. You can integrate Resend for production by updating the send route handler.

---

## 5. Running the Application

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 6. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase connection string (pooled, port 6543) |
| `DIRECT_URL` | Yes | Supabase direct connection (port 5432) |
| `NEXTAUTH_URL` | Yes | Your app URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT encryption |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `RESEND_API_KEY` | No | Resend API key for email sending |
| `RESEND_FROM_EMAIL` | No | Verified sender email address |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_APP_NAME` | No | App display name (default: LetterDrop) |

---

## 7. Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Self-hosted with `next build && next start`

---

## Troubleshooting

### Database connection issues
- Ensure your Supabase project is active (pauses after inactivity on free tier)
- Check that you're using the correct connection string format
- Verify your database password has no special characters that need URL encoding

### Authentication not working
- Verify `NEXTAUTH_URL` matches your actual URL
- Check that `NEXTAUTH_SECRET` is set
- For Google OAuth, ensure redirect URIs are correctly configured

### Prisma errors
- Run `npx prisma generate` after any schema changes
- Run `npx prisma migrate dev` to apply pending migrations
- Use `npx prisma studio` to inspect your database
