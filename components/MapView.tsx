"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Achievement } from "@/lib/supabase";
import { computeMobileLayout, computeDesktopLayout, viewBoxFor, LayoutNode } from "@/lib/mapLayout";

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function Node({
  node,
  unlocked,
  isShip,
  onOpen,
}: {
  node: LayoutNode;
  unlocked: boolean;
  isShip: boolean;
  onOpen: () => void;
}) {
  const { achievement, top, left, width } = node;
  return (
    <div
      className="absolute"
      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%` }}
    >
      <button
        type="button"
        onClick={unlocked ? onOpen : undefined}
        className={`relative block w-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.2)] ${
          unlocked ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {achievement.card_image_url ? (
          <img
            src={achievement.card_image_url}
            alt={achievement.title}
            className={`w-full h-auto block ${!unlocked ? "grayscale brightness-75 opacity-55" : ""}`}
          />
        ) : (
          <div className="w-full aspect-[3/5] bg-cream/40 rounded-lg" />
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[15%] aspect-square min-w-[26px] rounded-full bg-ink/75 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F5EAD6" strokeWidth={2} className="w-1/2 h-1/2">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
          </div>
        )}
      </button>
      <p className="text-center font-display text-[15px] text-ivory mt-2">
        {unlocked ? achievement.tag || achievement.title : "?"}
      </p>
      {isShip && (
        <div
          className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[70%] drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)] pointer-events-none"
          style={{ transform: "translateX(-50%) rotate(-6deg)" }}
        >
          <img src="/ship.png" alt="Barco" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}

function MapInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlUsername = searchParams.get("u");

  const [usernameInput, setUsernameInput] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [lastUnlockedId, setLastUnlockedId] = useState<string | null>(null);
  const [linkCodes, setLinkCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false });

      setAchievements(allAchievements || []);

      const { data: links } = await supabase
        .from("achievement_links")
        .select("*")
        .eq("is_active", true);

      const codeMap: Record<string, string> = {};
      (links || []).forEach((l) => {
        codeMap[l.achievement_id] = l.code;
      });
      setLinkCodes(codeMap);

      if (urlUsername) {
        const wattpad_username = normalizeUsername(urlUsername);
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("wattpad_username", wattpad_username)
          .maybeSingle();

        if (user) {
          setUserExists(true);
          const { data: userAchievements } = await supabase
            .from("user_achievements")
            .select("*")
            .eq("user_id", user.id)
            .order("unlocked_at", { ascending: false });

          setUnlockedIds(new Set((userAchievements || []).map((ua) => ua.achievement_id)));
          setLastUnlockedId(userAchievements?.[0]?.achievement_id || null);
        } else {
          setUserExists(false);
          setUnlockedIds(new Set());
          setLastUnlockedId(null);
        }
      }

      setLoading(false);
    }
    load();
  }, [urlUsername]);

  function handleSearch() {
    const clean = normalizeUsername(usernameInput);
    if (!clean) return;
    router.push(`/mi-viaje?u=${clean}`);
  }

  function openAchievement(achievementId: string) {
    const code = linkCodes[achievementId];
    if (!code) return;
    router.push(`/l/${code}?u=${urlUsername}`);
  }

  if (!urlUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
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
            Escribí tu usuario de Wattpad para ver tu viaje.
          </h1>
          <p className="text-xs text-ivory/75 mb-6">
            Usá siempre el mismo usuario para acumular tus logros.
          </p>
          <div className="bg-ivory rounded-2xl p-6 text-left">
            <label className="block text-xs font-semibold text-wine mb-2">
              Tu usuario de Wattpad
            </label>
            <input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="aly_reads"
              className="w-full border border-neutral-300 rounded-lg px-3 py-3 text-sm mb-4"
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="w-full bg-teal text-ivory rounded-lg py-3 text-sm font-semibold"
            >
              Ver mi viaje
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ivory text-sm">Cargando...</p>
      </div>
    );
  }

  const total = achievements.length;
  const unlockedCount = achievements.filter((a) => unlockedIds.has(a.id)).length;
  const progressPct = total > 0 ? (unlockedCount / total) * 100 : 0;

  const mobileLayout = computeMobileLayout(achievements);
  const desktopLayout = computeDesktopLayout(achievements);

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-6 px-5">
        <button
          onClick={() => router.push("/mi-viaje")}
          className="text-ivory text-sm font-semibold"
        >
          ← Buscar otro usuario
        </button>
      </div>

      <header className="text-center pt-2 px-5">
        <h1 className="font-display text-[34px] md:text-[42px] text-ivory">Mi viaje</h1>
        <p className="text-sm text-ivory/85 italic mt-1">Paquete de besos ilimitados</p>
      </header>

      <div className="max-w-[260px] mx-auto mt-4">
        <p className="text-xs text-ivory text-center mb-1.5">
          {userExists
            ? `${unlockedCount} de ${total} paradas desbloqueadas`
            : "Todavía no encontramos ese usuario"}
        </p>
        <div className="h-1.5 bg-ivory/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-cream rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {total === 0 ? (
        <p className="text-center text-ivory/70 text-sm mt-16">
          Todavía no hay paradas publicadas. Volvé pronto.
        </p>
      ) : (
        <>
          <div
            className="relative w-full max-w-[480px] mx-auto mt-6 md:hidden"
            style={{ aspectRatio: mobileLayout.aspectRatio }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={viewBoxFor(mobileLayout.aspectRatio)}
              preserveAspectRatio="none"
            >
              <path
                d={mobileLayout.pathD}
                fill="none"
                stroke="#FBF0DE"
                strokeWidth={4}
                strokeDasharray="1 14"
                strokeLinecap="round"
                opacity={0.55}
              />
            </svg>
            {mobileLayout.nodes.map((node) => (
              <Node
                key={node.achievement.id}
                node={node}
                unlocked={unlockedIds.has(node.achievement.id)}
                isShip={node.achievement.id === lastUnlockedId}
                onOpen={() => openAchievement(node.achievement.id)}
              />
            ))}
          </div>

          <div
            className="relative w-full max-w-[1400px] mx-auto mt-6 hidden md:block"
            style={{ height: "820px" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={viewBoxFor(desktopLayout.aspectRatio)}
              preserveAspectRatio="none"
            >
              <path
                d={desktopLayout.pathD}
                fill="none"
                stroke="#FBF0DE"
                strokeWidth={4}
                strokeDasharray="1 14"
                strokeLinecap="round"
                opacity={0.55}
              />
            </svg>
            {desktopLayout.nodes.map((node) => (
              <Node
                key={node.achievement.id}
                node={node}
                unlocked={unlockedIds.has(node.achievement.id)}
                isShip={node.achievement.id === lastUnlockedId}
                onOpen={() => openAchievement(node.achievement.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MapView() {
  return (
    <Suspense fallback={null}>
      <MapInner />
    </Suspense>
  );
}
