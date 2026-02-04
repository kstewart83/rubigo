/**
 * New Classification Guide page
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { GuideEditor } from "@/components/security/guide-editor";
import { createDevSubject } from "@/lib/access-control/session-resolver";
import type { GuideType } from "@/lib/security-actions";

export const metadata = {
    title: "New Classification Guide | Security | Rubigo",
    description: "Create a new classification guide",
};

export const dynamic = "force-dynamic";

interface Props {
    searchParams: Promise<{ type?: string }>;
}

export default async function NewGuidePage({ searchParams }: Props) {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();
    const subject = createDevSubject();
    const params = await searchParams;

    const guideType = (params.type as GuideType) || "sensitivity";

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <GuideEditor
                    mode="create"
                    guideType={guideType}
                    createdBy={subject.email}
                />
            </AppShell>
        </PersonaProvider>
    );
}
