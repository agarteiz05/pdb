"use client";

import { useState, useRef } from "react";
import { supabase, StopType, Achievement, AchievementLink } from "@/lib/supabase";
import { generateLinkCode } from "@/lib/linkCode";
import { renderPreview } from "@/lib/renderPreview";

type Row = Achievement & { link?: AchievementLink };

export default function AchievementModal({
  onClose,
  onSaved,
  nextSortOrder,
  achievement,
}: {
  onClose: () => void;
  onSaved: () => void;
  nextSortOrder: number;
  achievement?: Row;
}) {
  const isEditing = Boolean(achievement);

  const [stopType, setStopType] = useState<StopType>(achievement?.stop_type || "puerto");
  const [title, setTitle] = useState(achievement?.title || "");
  const [tag, setTag] = useState(achievement?.tag || "");
  const [characterName, setCharacterName] = useState(achievement?.character_name || "");
  const [contentMarkdown, setContentMarkdown] = useState(achievement?.content_markdown || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl] = useState(achievement?.card_image_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(before: string, after: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = contentMarkdown.slice(start, end);
    const newText =
      contentMarkdown.slice(0, start) + before + selected + after + contentMarkdown.slice(end);
    setContentMarkdown(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertSubtitle() {
    insertAtCursor("\n\n## Subtítulo\n\n");
  }

  function insertBold() {
    insertAtCursor("**", "**");
  }

  function insertImage() {
    insertAtCursor("\n\n![descripción](url-de-la-imagen)\n\n");
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return existingImageUrl;
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("achievement-images")
      .upload(path, imageFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("achievement-images")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async function ensureLink(achievementId: string) {
    if (achievement?.link) {
      if (!achievement.link.is_active) {
        await supabase
          .from("achievement_links")
          .update({ is_active: true })
          .eq("id", achievement.link.id);
      }
      return;
    }
    const code = generateLinkCode();
    const { error: linkError } = await supabase.from("achievement_links").insert({
      code,
      achievement_id: achievementId,
      is_active: true,
    });
    if (linkError) throw linkError;
  }

  async function handleSave(publish: boolean) {
    if (!title.trim()) {
      setError("Poné un título para el logro.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const imageUrl = await uploadImage();

      const payload = {
        stop_type: stopType,
        title,
        tag: tag || null,
        character_name: characterName || null,
        content_markdown: contentMarkdown || null,
        card_image_url: imageUrl,
        is_active: publish,
      };

      if (isEditing && achievement) {
        const { error: updateError } = await supabase
          .from("achievements")
          .update(payload)
          .eq("id", achievement.id);
        if (updateError) throw updateError;

        if (publish) {
          await ensureLink(achievement.id);
        }
      } else {
        const { data: created, error: insertError } = await supabase
          .from("achievements")
          .insert({ ...payload, sort_order: nextSortOrder })
          .select()
          .single();
        if (insertError) throw insertError;

        if (publish) {
          const code = generateLinkCode();
          const { error: linkError } = await supabase.from("achievement_links").insert({
            code,
            achievement_id: created.id,
            is_active: true,
          });
          if (linkError) throw linkError;
        }
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Algo falló guardando el logro. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Editar logro" : "Nuevo logro"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setStopType("puerto")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${
              stopType === "puerto"
                ? "border-emerald-800 bg-emerald-50 text-emerald-800"
                : "border-neutral-200 text-neutral-500"
            }`}
          >
            Puerto
          </button>
          <button
            onClick={() => setStopType("evento")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${
              stopType === "evento"
                ? "border-pink text-pink"
                : "border-neutral-200 text-neutral-500"
            }`}
          >
            Evento en altamar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Título del logro
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lo que pasó en cubierta"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Nombre del puerto o evento
            </label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="La noche blanca"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Personaje (opcional)
            </label>
            <input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Jade"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Imagen (puerto o charm)
            </label>
            {existingImageUrl && !imageFile && (
              <div className="flex items-center gap-2 mb-1.5">
                <img src={existingImageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                <span className="text-xs text-neutral-400">imagen actual</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm border border-dashed border-neutral-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
          Contenido del logro
        </label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={insertSubtitle}
            className="text-xs font-medium border border-neutral-300 rounded-md px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100"
          >
            H2 subtítulo
          </button>
          <button
            type="button"
            onClick={insertBold}
            className="text-xs font-medium border border-neutral-300 rounded-md px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100"
          >
            B negrita
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="text-xs font-medium border border-neutral-300 rounded-md px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100"
          >
            🖼 imagen
          </button>
          <span className="text-xs text-neutral-400 self-center">
            pegá un link de Spotify en su propia línea para embeberlo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <textarea
            ref={textareaRef}
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
            rows={12}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
          <div className="border border-neutral-200 rounded-lg px-4 py-3 bg-neutral-50 overflow-y-auto max-h-[280px]">
            {renderPreview(contentMarkdown)}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 border border-neutral-300 rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
          >
            Guardar como borrador
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-[1.4] bg-emerald-800 text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
          >
            {saving
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Crear logro y generar link"}
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Un borrador no genera un link visible para las lectoras hasta que lo publiques.
        </p>
      </div>
    </div>
  );
}
