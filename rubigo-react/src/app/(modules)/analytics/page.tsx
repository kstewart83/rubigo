import { redirect } from "next/navigation";

export default function AnalyticsPage() {
    // Redirect to overview sub-page by default
    redirect("/analytics/overview");
}
