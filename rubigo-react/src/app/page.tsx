import { redirect } from "next/navigation";

/**
 * Root page redirects to dashboard
 * The dashboard/personnel pages handle sign-in via AppShell
 */
export default function Home() {
  redirect("/dashboard");
}
