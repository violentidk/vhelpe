import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UploadZone } from "@/components/upload-zone";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <UploadZone />
    </AppShell>
  );
}
