import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { redirect } from "next/navigation";

const personnel = getAllPersonnel();

export default function LogsPage() {
    // Redirect to actions sub-page by default
    redirect("/logs/actions");
}
