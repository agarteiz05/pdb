import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StopType = "puerto" | "evento";

export type Achievement = {
  id: string;
  stop_type: StopType;
  tag: string | null;
  title: string;
  card_number: number | null;
  character_name: string | null;
  card_image_url: string | null;
  content_markdown: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

export type AchievementLink = {
  id: string;
  code: string;
  achievement_id: string;
  is_active: boolean;
  created_at: string;
};
