import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  {
    name: "Personnel",
    description: "Manage employee records, roles, and organizational structure",
    href: "/personnel",
    icon: "👥",
  },
  {
    name: "Calendar",
    description: "Schedule events, meetings, and manage time effectively",
    href: "/calendar",
    icon: "📅",
  },
  {
    name: "Chat",
    description: "Team messaging and real-time communication",
    href: "/chat",
    icon: "💬",
  },
  {
    name: "Security",
    description: "Access control, permissions, and security policies",
    href: "/security",
    icon: "🔐",
  },
  {
    name: "Information Assurance",
    description: "Compliance tracking, auditing, and information security",
    href: "/information-assurance",
    icon: "🛡️",
  },
  {
    name: "Logistics",
    description: "Supply chain management, inventory, and resource allocation",
    href: "/logistics",
    icon: "📦",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Rubigo</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Documentation</Button>
            <Button size="sm">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl md:text-6xl">
          Enterprise Resource Management
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          A unified platform for managing your organization&apos;s personnel, communications,
          security, and logistics in one place.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Platform Modules
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{module.icon}</span>
                    <CardTitle className="text-xl">{module.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Rubigo ERM Platform. Built with Next.js, ShadCN/UI, and Bun.</p>
        </div>
      </footer>
    </div>
  );
}
