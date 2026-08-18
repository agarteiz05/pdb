"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Achievement } from "@/lib/supabase";
import { renderContent } from "@/lib/renderContent";

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function UnlockInner({
  achievement,
  code,
}: {
  achievement: Achievement;
  code: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlUsername = searchParams.get("u");
  const [username, setUsername] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoChecking, setAutoChecking] = useState(Boolean(urlUsername));
  const [error, setError] = useState("");

  useEffect(() => {
    if (urlUsername) {
      setUsername(urlUsername);
      unlock(urlUsername);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(rawUsername: string) {
    const wattpad_username = normalizeUsername(rawUsername);
    if (!wattpad_username) {
      setError("Escribí tu usuario de Wattpad.");
      setAutoChecking(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      let { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("wattpad_username", wattpad_username)
        .maybeSingle();

      if (!user) {
        const { data: created, error: createError } = await supabase
          .from("users")
          .insert({ wattpad_username })
          .select()
          .single();
        if (createError) throw createError;
        user = created;
      }

      await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievement.id,
        link_code: code,
      });
      // ignoramos el error de duplicado: unique(user_id, achievement_id)

      setUnlocked(true);
    } catch (err) {
      console.error(err);
      setError("Algo falló. Probá de nuevo.");
    } finally {
      setLoading(false);
      setAutoChecking(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: achievement.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (autoChecking) {
    return (
      <div className="min-h-screen bg-pink flex items-center justify-center">
        <p className="text-ivory text-sm">Un momento...</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-pink flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <img
            src="/cover.png"
            alt="Paquete de besos ilimitados"
            className="w-40 mx-auto mb-6 rounded drop-shadow-[0_10px_20px_rgba(43,27,18,0.3)]"
          />
          <p className="font-display text-xs tracking-widest text-ivory uppercase mb-2">
            PDB · Aly Sanchez
          </p>
          <h1 className="font-display text-2xl text-ivory mb-2 leading-snug">
            Escribí tu usuario de Wattpad para ver este recuerdo.
          </h1>
          <p className="text-xs text-ivory/75 mb-6">
            Usá siempre el mismo usuario para acumular tus logros.
          </p>
          <div className="bg-ivory rounded-2xl p-6 text-left">
            <label className="block text-xs font-semibold text-wine mb-2">
              Tu usuario de Wattpad
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock(username)}
              placeholder="aly_reads"
              className="w-full border border-neutral-300 rounded-lg px-3 py-3 text-sm mb-4"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button
              onClick={() => unlock(username)}
              disabled={loading}
              className="w-full bg-teal text-ivory rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Un momento..." : "Ver mi recuerdo"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink px-6 py-10">
      <button
        onClick={() => router.push(`/mi-viaje?u=${username}`)}
        className="text-ivory text-sm font-semibold mb-6 inline-block"
      >
        ← Mi viaje
      </button>

      <div className="grid md:grid-cols-[320px_1fr] gap-10 max-w-[1100px] mx-auto items-start">
        <div>
          <span className="inline-block bg-cream text-wine text-[11px] font-semibold uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-3.5">
            {achievement.stop_type === "puerto" ? "Puerto" : "Evento"}
            {achievement.tag ? ` · ${achievement.tag}` : ""}
          </span>
          {achievement.card_image_url && (
            <img
              src={achievement.card_image_url}
              alt={achievement.title}
              className="w-full max-w-[240px] mx-auto md:max-w-none drop-shadow-[0_6px_14px_rgba(43,27,18,0.22)] mb-5"
            />
          )}
          <div className="flex gap-2.5 max-w-[240px] mx-auto md:max-w-none">
            <a
              href={achievement.card_image_url || "#"}
              download
              className="flex-1 text-center border border-ivory text-ivory rounded-lg py-3 text-[13px] font-semibold"
            >
              ↓ Descargar
            </a>
            <button
              onClick={handleShare}
              className="flex-[1.2] bg-mustard text-[#4A1B0C] rounded-lg py-3 text-[13px] font-semibold"
            >
              ↗ Compartir
            </button>
          </div>
        </div>

        <div className="bg-ivory rounded-2xl p-8 md:p-10">
          <h1 className="font-display text-2xl text-ink mb-4">{achievement.title}</h1>
          {renderContent(achievement.content_markdown)}
        </div>
      </div>
    </div>
  );
}

export default function AchievementUnlock({
  achievement,
  code,
}: {
  achievement: Achievement;
  code: string;
}) {
  return (
    <Suspense fallback={null}>
      <UnlockInner achievement={achievement} code={code} />
    </Suspense>
  );
}
