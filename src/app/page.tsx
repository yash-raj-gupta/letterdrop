import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Mail,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Send className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              LetterDrop
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Simple. Powerful. Affordable.
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Newsletters made{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  effortless
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                Build your email audience, craft beautiful newsletters, and grow
                your brand. No bloat, no complexity — just the tools you need to
                connect with your readers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="text-base px-8 h-12">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8 h-12"
                  >
                    See How It Works
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                Free up to 500 subscribers. No credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Newsletters Sent
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">2K+</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Active Creators
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Delivery Rate
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">4.9/5</div>
                <div className="text-sm text-muted-foreground mt-1">
                  User Rating
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to grow
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A complete toolkit for building and engaging your email audience.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Mail,
                  title: "Beautiful Editor",
                  description:
                    "Craft stunning newsletters with our intuitive editor. Add text, images, buttons, and more — no design skills needed.",
                },
                {
                  icon: Users,
                  title: "Subscriber Management",
                  description:
                    "Import, organize, and segment your audience with tags. Track growth and engagement effortlessly.",
                },
                {
                  icon: BarChart3,
                  title: "Detailed Analytics",
                  description:
                    "Track opens, clicks, and subscriber growth. Understand what resonates with your audience.",
                },
                {
                  icon: Zap,
                  title: "Scheduled Sending",
                  description:
                    "Write now, send later. Schedule newsletters for the perfect time to reach your audience.",
                },
                {
                  icon: Globe,
                  title: "Public Archive",
                  description:
                    "Every newsletter gets a public page. Share past issues and boost SEO with your content.",
                },
                {
                  icon: Shield,
                  title: "Reliable Delivery",
                  description:
                    "Built on trusted email infrastructure. Your newsletters land in inboxes, not spam folders.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/20"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps to start connecting with your audience.
              </p>
            </div>
            <div className="mx-auto max-w-4xl grid gap-12 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description:
                    "Sign up for free in seconds. Set up your brand name and sender details.",
                },
                {
                  step: "02",
                  title: "Build your audience",
                  description:
                    "Share your subscribe page or embed a form on your website. Import existing contacts.",
                },
                {
                  step: "03",
                  title: "Send newsletters",
                  description:
                    "Write your newsletter, preview it, and send to your subscribers with one click.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free, upgrade when you grow. No hidden fees.
              </p>
            </div>
            <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Free",
                  price: "$0",
                  period: "forever",
                  subscribers: "500",
                  emails: "1,000/mo",
                  features: [
                    "Basic editor",
                    "Public archive",
                    "Email support",
                  ],
                  cta: "Get Started",
                  href: "/register",
                  highlighted: false,
                },
                {
                  name: "Starter",
                  price: "$9",
                  period: "/month",
                  subscribers: "2,500",
                  emails: "Unlimited",
                  features: [
                    "Everything in Free",
                    "Custom templates",
                    "Scheduling",
                    "CSV import",
                  ],
                  cta: "Start Free Trial",
                  href: "/register?plan=STARTER",
                  highlighted: false,
                },
                {
                  name: "Growth",
                  price: "$29",
                  period: "/month",
                  subscribers: "10,000",
                  emails: "Unlimited",
                  features: [
                    "Everything in Starter",
                    "Advanced analytics",
                    "Priority support",
                    "Tags & segments",
                  ],
                  cta: "Start Free Trial",
                  href: "/register?plan=GROWTH",
                  highlighted: true,
                },
                {
                  name: "Pro",
                  price: "$79",
                  period: "/month",
                  subscribers: "50,000",
                  emails: "Unlimited",
                  features: [
                    "Everything in Growth",
                    "Custom domain",
                    "API access",
                    "Dedicated support",
                  ],
                  cta: "Start Free Trial",
                  href: "/register?plan=PRO",
                  highlighted: false,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-8 flex flex-col ${
                    plan.highlighted
                      ? "border-primary bg-primary/5 shadow-lg scale-105"
                      : "bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-block rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-6 text-sm text-muted-foreground">
                    <p>Up to {plan.subscribers} subscribers</p>
                    <p>{plan.emails} emails</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-auto">
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-2xl space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to grow your audience?
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Join thousands of creators who use LetterDrop to build
                meaningful connections with their readers.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 h-12 mt-4"
                >
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">LetterDrop</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The simplest way to build your email audience and send beautiful
                newsletters.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; 2024 LetterDrop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
