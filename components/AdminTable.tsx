"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, Achievement, AchievementLink } from "@/lib/supabase";
import AchievementModal from "./AchievementModal";

type Row = Achievement & { link?: AchievementLink };

export default function AdminTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false });

    const { data: links } = await supabase.from("achievement_links").select("*");

    const merged: Row[] = (achievements || []).map((a) => ({
      ...a,
      link: links?.find((l) => l.achievement_id === a.id),
    }));
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(row: Row) {
    await supabase
      .from("achievements")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (row.link) {
      await supabase
        .from("achievement_links")
        .update({ is_active: !row.is_active })
        .eq("id", row.link.id);
    }
    load();
  }

  async function remove(row: Row) {
    if (!confirm(`¿Eliminar "${row.title}"? Esto también lo borra del viaje de las lectoras que ya lo tenían.`)) {
      return;
    }
    await supabase.from("achievements").delete().eq("id", row.id);
    load();
  }

  async function move(row: Row, direction: "up" | "down") {
    const index = rows.findIndex((r) => r.id === row.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) return;
    const other = rows[swapIndex];

    await supabase
      .from("achievements")
      .update({ sort_order: other.sort_order })
      .eq("id", row.id);
    await supabase
      .from("achievements")
      .update({ sort_order: row.sort_order })
      .eq("id", other.id);
    load();
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/l/${code}`);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function openCreate() {
    setEditingRow(null);
    setShowModal(true);
  }

  function openEdit(row: Row) {
    setEditingRow(row);
    setShowModal(true);
  }

  const nextSortOrder =
    rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order || 0)) + 1 : 1;

  return (
    <div className="p-10">
      <div className="flex justify-between items-end mb-7">
        <div>
          <p className="text-xs tracking-wide text-neutral-400 uppercase mb-1">
            Paquete de besos ilimitados
          </p>
          <h1 className="text-2xl font-bold">Logros</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={logout} className="text-sm text-neutral-400">
            Cerrar sesión
          </button>
          <button
            onClick={openCreate}
            className="bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            + Nuevo logro
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando...</p>
      ) : (
        <table className="w-full bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <thead>
            <tr className="text-left text-xs text-neutral-400 border-b border-neutral-200">
              <th className="p-4">Orden</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Etiqueta</th>
              <th className="p-4">Logro</th>
              <th className="p-4">Link</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-0 text-sm">
                <td className="p-4">
                  <div className="flex flex-col gap-0.5 text-neutral-300">
                    <button onClick={() => move(row, "up")}>▲</button>
                    <button onClick={() => move(row, "down")}>▼</button>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      row.stop_type === "puerto"
                        ? "bg-teal-50 text-teal-800"
                        : "bg-pink-50 text-pink-800"
                    }`}
                  >
                    {row.stop_type === "puerto" ? "Puerto" : "Evento"}
                  </span>
                </td>
                <td className="p-4 text-neutral-500">{row.tag || "sin etiqueta"}</td>
                <td className="p-4 font-medium">{row.title}</td>
                <td className="p-4">
                  {row.link ? (
                    <button
                      onClick={() => copyLink(row.link!.code)}
                      className="text-teal-700 font-mono text-xs"
                    >
                      /l/{row.link.code} ⧉
                    </button>
                  ) : (
                    <span className="text-neutral-300 text-xs">sin link</span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      row.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {row.is_active ? "Activo" : "Oculto"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2.5 text-neutral-400">
                    <button onClick={() => toggleActive(row)} title="Mostrar/ocultar">
                      {row.is_active ? "👁" : "🙈"}
                    </button>
                    <button onClick={() => openEdit(row)} title="Editar">
                      ✎
                    </button>
                    <button onClick={() => remove(row)} title="Eliminar">
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-neutral-400 mt-4">
        Copiá el link de un logro y pegalo donde quieras: un capítulo, tu bio de Instagram, donde se te ocurra.
      </p>

      {showModal && (
        <AchievementModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
          nextSortOrder={nextSortOrder}
          achievement={editingRow || undefined}
        />
      )}
    </div>
  );
}
