"use server";

import { redirect } from "next/navigation";

/**
 * Security module landing page - redirects to Guides submodule
 */
export default async function SecurityPage() {
    redirect("/security/guides");
}
