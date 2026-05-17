import { redirect } from "next/navigation";

import { CreateStorefrontClient } from "@/components/CreateStorefrontClient";
import { getCurrentUser } from "@/lib/auth";

export default async function CreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/create&message=auth_required");
  }

  return (
    <main className="page create-page">
      <CreateStorefrontClient />
    </main>
  );
}
