import { getUserProfile } from "@/app/actions/user";
import { getResumableGeneration } from "@/app/actions/generation";
import { IngestionForm } from "@/components/dashboard/ingestion-form";

export default async function DashboardPage() {
  const [profile, resumableGeneration] = await Promise.all([
    getUserProfile(),
    getResumableGeneration(),
  ]);

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#0b0a09]">
      <IngestionForm
        userId={profile.id}
        lastGeneratedImageUrl={profile.last_generated_image_url}
        initialGeneration={resumableGeneration}
      />
    </main>
  );
}
