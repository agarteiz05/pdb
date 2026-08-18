import { supabase } from "@/lib/supabase";
import AchievementUnlock from "@/components/AchievementUnlock";

export default async function LogroPage({
  params,
}: {
  params: { code: string };
}) {
  const { data: link } = await supabase
    .from("achievement_links")
    .select("*")
    .eq("code", params.code)
    .eq("is_active", true)
    .maybeSingle();

  if (!link) {
    return (
      <div className="min-h-screen bg-pink flex items-center justify-center p-6 text-center">
        <p className="text-ivory font-display text-xl">
          Este link no existe o ya no está disponible.
        </p>
      </div>
    );
  }

  const { data: achievement } = await supabase
    .from("achievements")
    .select("*")
    .eq("id", link.achievement_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!achievement) {
    return (
      <div className="min-h-screen bg-pink flex items-center justify-center p-6 text-center">
        <p className="text-ivory font-display text-xl">
          Este link no existe o ya no está disponible.
        </p>
      </div>
    );
  }

  return <AchievementUnlock achievement={achievement} code={params.code} />;
}
