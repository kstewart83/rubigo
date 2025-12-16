import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getPersonnelPage } from "@/lib/personnel-actions";
import { PersonnelPageContent } from "@/components/personnel-page-content";

// Force dynamic rendering - personnel data must be fetched at request time
export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        search?: string;
        department?: string;
    }>;
}

export default async function PersonnelPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Parse URL params
    const page = parseInt(params.page || "1", 10);
    const pageSize = parseInt(params.pageSize || "10", 10);
    const search = params.search || "";
    const department = params.department || "all";

    // Get paginated personnel data
    const paginatedData = await getPersonnelPage({
        page,
        pageSize,
        search,
        department,
    });

    // Also get all personnel for AppShell (persona switcher)
    const allPersonnel = getAllPersonnel();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel}>
                <PersonnelPageContent
                    data={paginatedData.data}
                    total={paginatedData.total}
                    page={paginatedData.page}
                    pageSize={paginatedData.pageSize}
                    totalPages={paginatedData.totalPages}
                    search={search}
                    department={department}
                    allPersonnel={allPersonnel}
                />
            </AppShell>
        </PersonaProvider>
    );
}
